import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useCreateQuote, QuoteItem, QuotePayment } from "@/hooks/useQuotes";
import { useProcedures } from "@/hooks/useProcedures";
import { SearchEntityInput } from "@/components/common/SearchEntityInput";
import { useProfessionals } from "@/hooks/useProfessionals";
import { TeethMultiSelect } from "@/components/orcamentos/TeethMultiSelect";

const phoneRegex = /^(\+?55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;

const quoteSchema = z.object({
  contact_type: z.enum(["lead", "patient", "new"]),
  lead_id: z.string().optional(),
  patient_id: z.string().optional(),
  contact_name: z.string().min(1, "Nome é obrigatório"),
  contact_phone: z.string().min(1, "Telefone é obrigatório").regex(phoneRegex, "Telefone inválido"),
  contact_email: z.string().email("Email inválido").optional().or(z.literal("")),
  payment_type: z.enum(["particular", "convenio"]),
  professional_id: z.string().optional(),
  valid_until: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), { message: "Data inválida" }),
  notes: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
  onSuccess?: () => void;
  initialContact?: {
    id: string;
    name: string;
    phone: string;
    type: "lead" | "patient";
    email?: string | null;
  };
}

export function QuoteForm({ onSuccess, initialContact }: QuoteFormProps) {
  const createQuote = useCreateQuote();
  const { data: procedures } = useProcedures();
  const { data: professionals } = useProfessionals(true);

  const [items, setItems] = useState<QuoteItem[]>([
    { procedure_name: "", quantity: 1, unit_price: 0, subtotal: 0, total_price: 0, tooth: "", specialty: "" },
  ]);
  const [payments, setPayments] = useState<QuotePayment[]>([]);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      contact_type: "new",
      contact_name: "",
      contact_phone: "",
      contact_email: "",
      payment_type: "particular",
      professional_id: "",
    },
  });

  const contactType = form.watch("contact_type");

  useEffect(() => {
    if (!initialContact) return;
    form.setValue("contact_type", initialContact.type);
    if (initialContact.type === "patient") {
      form.setValue("patient_id", initialContact.id);
      form.setValue("lead_id", "");
    } else {
      form.setValue("lead_id", initialContact.id);
      form.setValue("patient_id", "");
    }
    form.setValue("contact_name", initialContact.name);
    form.setValue("contact_phone", initialContact.phone);
    form.setValue("contact_email", initialContact.email || "");
  }, [form, initialContact]);
  const handleSelectEntity = (
    entity: { id: string; name: string; phone: string; type: "lead" | "patient"; email?: string | null } | null
  ) => {
    if (!entity) return;
    form.setValue("contact_name", entity.name);
    form.setValue("contact_phone", entity.phone);
    if (entity.type === "patient") {
      form.setValue("contact_email", entity.email || "");
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { procedure_name: "", quantity: 1, unit_price: 0, subtotal: 0, total_price: 0, tooth: "", specialty: "" },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalcular total do item
    if (field === "quantity" || field === "unit_price") {
      const subtotal = newItems[index].quantity * newItems[index].unit_price;
      newItems[index].subtotal = subtotal;
      newItems[index].total_price = subtotal;
    }

    // Se selecionou um procedimento, preencher com dados do procedimento
    if (field === "procedure_id" && value) {
      const procedure = procedures?.find((p) => p.id === value);
      if (procedure) {
        newItems[index].procedure_name = procedure.name;
        newItems[index].unit_price = procedure.default_price || 0;
        newItems[index].specialty = procedure.category;
        const subtotal = newItems[index].quantity * (procedure.default_price || 0);
        newItems[index].subtotal = subtotal;
        newItems[index].total_price = subtotal;
      }
    }

    setItems(newItems);
  };

  const parseTeethValue = (value?: string | null) =>
    value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];

  const formatTeethValue = (values: string[]) => values.join(", ");

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const addPayment = () => {
    const total = calculateTotal();
    const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = Math.max(total - paymentsTotal, 0);

    setPayments([
      ...payments,
      {
        installment_number: payments.length + 1,
        due_date: new Date().toISOString().split("T")[0],
        amount: remaining > 0 ? remaining : total,
        payment_method: "dinheiro",
        status: "pending",
      },
    ]);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index: number, field: keyof QuotePayment, value: any) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setPayments(newPayments);
  };

  const onSubmit = async (data: QuoteFormValues) => {
    if (items.length === 0 || items.some((item) => !item.procedure_name)) {
      return;
    }

    if (items.some((item) => item.quantity <= 0 || item.unit_price <= 0)) {
      return;
    }

    const total = calculateTotal();
    const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const hasInvalidPayment = payments.some(
      (payment) => !payment.payment_method || !payment.due_date || payment.amount <= 0
    );

    if (paymentsTotal > total || hasInvalidPayment) {
      return;
    }

    await createQuote.mutateAsync({
      lead_id: data.contact_type === "lead" ? data.lead_id : undefined,
      patient_id: data.contact_type === "patient" ? data.patient_id : undefined,
      contact_name: data.contact_name,
      contact_phone: data.contact_phone,
      contact_email: data.contact_email,
      payment_type: data.payment_type,
      professional_id: data.professional_id || undefined,
      valid_until: data.valid_until,
      notes: data.notes,
      items: items.filter((item) => item.procedure_name),
      payments: payments
        .filter((payment) => payment.payment_method && payment.amount > 0)
        .map((payment, index) => ({
          ...payment,
          installment_number: index + 1,
          due_date: payment.due_date || new Date().toISOString().split("T")[0],
          status: payment.status || "pending",
        })),
    });

    onSuccess?.();
  };

  const total = calculateTotal();
  const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = total - paymentsTotal;
  const hasInvalidPayment = payments.some(
    (payment) => !payment.payment_method || !payment.due_date || payment.amount <= 0
  );
  const exceedsTotal = paymentsTotal > total;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="contact_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contato</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">Novo Contato</SelectItem>
                      <SelectItem value="lead">Lead Existente</SelectItem>
                      <SelectItem value="patient">Paciente Existente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {contactType === "lead" && (
              <FormField
                control={form.control}
                name="lead_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecionar Lead</FormLabel>
                    <FormControl>
                      <SearchEntityInput
                        entityType="lead"
                        value={field.value}
                        placeholder="Buscar lead"
                        onSelect={(entity) => {
                          field.onChange(entity?.id ?? "");
                          if (entity) {
                            form.setValue("patient_id", "");
                            form.setValue("contact_email", "");
                            handleSelectEntity(entity);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {contactType === "patient" && (
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecionar Paciente</FormLabel>
                    <FormControl>
                      <SearchEntityInput
                        entityType="patient"
                        value={field.value}
                        placeholder="Buscar paciente"
                        onSelect={(entity) => {
                          field.onChange(entity?.id ?? "");
                          if (entity) {
                            form.setValue("lead_id", "");
                            form.setValue("contact_email", "");
                            handleSelectEntity(entity);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="payment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Convênio / Particular</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="particular">Particular</SelectItem>
                      <SelectItem value="convenio">Convênio</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="professional_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profissional responsável</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o profissional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {professionals?.filter((prof) => prof.active).map((professional) => (
                        <SelectItem key={professional.id} value={professional.id}>
                          {professional.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valid_until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Válido até (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Procedimentos</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-start p-4 border rounded-lg">
                <div className="flex-1 grid grid-cols-6 gap-2">
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Procedimento</label>
                    <Select
                      value={item.procedure_id || ""}
                      onValueChange={(value) => updateItem(index, "procedure_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {procedures?.filter((p) => p.active).map((proc) => (
                          <SelectItem key={proc.id} value={proc.id}>
                            {proc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Especialidade</label>
                    <Input
                      value={item.specialty || ""}
                      onChange={(e) => updateItem(index, "specialty", e.target.value)}
                      placeholder="Ex.: Ortodontia"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dentes</label>
                    <TeethMultiSelect
                      value={parseTeethValue(item.tooth)}
                      onChange={(values) => updateItem(index, "tooth", formatTeethValue(values))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Qtd</label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Valor Unit.</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-6">
                    <label className="text-sm font-medium">Subtotal: R$ {item.subtotal.toFixed(2)}</label>
                  </div>
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total do Orçamento</p>
                <p className="text-2xl font-bold">R$ {calculateTotal().toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder="Observações adicionais..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pagamentos</CardTitle>
              <Button type="button" onClick={addPayment} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pagamento
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Adicione informações de pagamento (dinheiro, cartão, pix, etc).
              </p>
            ) : (
              payments.map((payment, index) => (
                <div key={index} className="flex flex-col gap-3 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-sm font-medium">Forma</label>
                      <Select
                        value={payment.payment_method || ""}
                        onValueChange={(value) => updatePayment(index, "payment_method", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="cartao">Cartão</SelectItem>
                          <SelectItem value="pix">Pix</SelectItem>
                          <SelectItem value="transferencia">Transferência</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Vencimento</label>
                      <Input
                        type="date"
                        value={payment.due_date}
                        onChange={(e) => updatePayment(index, "due_date", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Valor</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={payment.amount}
                        onChange={(e) => updatePayment(index, "amount", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={payment.status}
                        onValueChange={(value) => updatePayment(index, "status", value as QuotePayment["status"])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="overdue">Em atraso</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePayment(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))
            )}
            {payments.length > 0 && (
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total do orçamento</span>
                  <span className="font-medium">R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total parcelado</span>
                  <span className="font-medium">R$ {paymentsTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Saldo restante</span>
                  <span className={remaining < 0 ? "font-medium text-destructive" : "font-medium"}>
                    R$ {remaining.toFixed(2)}
                  </span>
                </div>
                {(hasInvalidPayment || exceedsTotal) && (
                  <p className="text-destructive text-xs">
                    Confira as parcelas: informe forma e vencimento, valor maior que zero e evite soma acima do total.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={createQuote.isPending || hasInvalidPayment || exceedsTotal}>
            {createQuote.isPending ? "Criando..." : "Criar Orçamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
