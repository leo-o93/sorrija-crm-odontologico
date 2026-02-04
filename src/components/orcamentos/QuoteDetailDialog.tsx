import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuote, useUpdateQuote, type QuoteItem, useAddQuoteItems } from "@/hooks/useQuotes";
import { Loader2, Send, CheckCircle, XCircle, FileText, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { useProcedures } from "@/hooks/useProcedures";
import { Input } from "@/components/ui/input";
import { TeethMultiSelect } from "@/components/orcamentos/TeethMultiSelect";

interface QuoteDetailDialogProps {
  quoteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGeneratePDF?: (quoteId: string) => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  expired: "bg-orange-500",
  converted: "bg-purple-500",
  not_closed: "bg-red-500",
  partially_closed: "bg-yellow-500",
  closed: "bg-emerald-500",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  expired: "Expirado",
  converted: "Convertido",
  not_closed: "Não fechou",
  partially_closed: "Fechou parte",
  closed: "Fechou tudo",
};

const paymentMethodLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  pix: "Pix",
  transferencia: "Transferência",
  boleto: "Boleto",
};

export function QuoteDetailDialog({ quoteId, open, onOpenChange, onGeneratePDF }: QuoteDetailDialogProps) {
  const { data: quote, isLoading } = useQuote(quoteId || "");
  const updateQuote = useUpdateQuote();
  const addQuoteItems = useAddQuoteItems();
  const { data: procedures } = useProcedures();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [items, setItems] = useState<QuoteItem[]>([
    { procedure_name: "", quantity: 1, unit_price: 0, subtotal: 0, total_price: 0, tooth: "", specialty: "" },
  ]);

  const parseTeethValue = (value?: string | null) =>
    value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];

  const formatTeethValue = (values: string[]) => values.join(", ");

  const addItemRow = () => {
    setItems([
      ...items,
      { procedure_name: "", quantity: 1, unit_price: 0, subtotal: 0, total_price: 0, tooth: "", specialty: "" },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "unit_price") {
      const subtotal = newItems[index].quantity * newItems[index].unit_price;
      newItems[index].subtotal = subtotal;
      newItems[index].total_price = subtotal;
    }

    if (field === "procedure_id" && value) {
      const procedure = procedures?.find((proc) => proc.id === value);
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

  const handleAddItems = async () => {
    if (!quoteId) return;
    const validItems = items.filter((item) => item.procedure_name);
    if (validItems.length === 0) {
      toast.error("Adicione ao menos um procedimento.");
      return;
    }
    await addQuoteItems.mutateAsync({ quoteId, items: validItems });
    setItems([{ procedure_name: "", quantity: 1, unit_price: 0, subtotal: 0, total_price: 0, tooth: "", specialty: "" }]);
    setIsAddingItems(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!quoteId) return;

    if (["partially_closed", "closed"].includes(newStatus)) {
      if (!quote?.quote_payments || quote.quote_payments.length === 0) {
        toast.error("Adicione um pagamento antes de fechar o orçamento.");
        return;
      }
    }
    
    setIsUpdating(true);
    try {
      await updateQuote.mutateAsync({ id: quoteId, status: newStatus });
      toast.success(`Status alterado para ${statusLabels[newStatus]}`);
    } catch (error) {
      toast.error("Erro ao atualizar status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!quoteId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            Detalhes do Orçamento
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : quote ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">#{quote.quote_number}</h2>
                  <Badge className={statusColors[quote.status]}>
                    {statusLabels[quote.status]}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Data do orçamento: {format(new Date(quote.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="flex gap-2">
                {onGeneratePDF && (
                  <Button variant="outline" onClick={() => onGeneratePDF(quoteId)}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsAddingItems((prev) => !prev)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar procedimentos
                </Button>
              </div>
            </div>

            <Separator />

            {/* Client Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nome</p>
                  <p className="font-medium">{quote.contact_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{quote.contact_phone}</p>
                </div>
                {quote.contact_email && (
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{quote.contact_email}</p>
                  </div>
                )}
                {quote.valid_until && (
                  <div>
                    <p className="text-muted-foreground">Válido até</p>
                    <p className="font-medium">
                      {format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {quote.payment_type && (
                  <div>
                    <p className="text-muted-foreground">Convênio / Particular</p>
                    <p className="font-medium">
                      {quote.payment_type === "convenio" ? "Convênio" : "Particular"}
                    </p>
                  </div>
                )}
                {quote.professional?.name && (
                  <div>
                    <p className="text-muted-foreground">Profissional responsável</p>
                    <p className="font-medium">{quote.professional.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Procedimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Dentes</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.quote_items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.procedure_name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </TableCell>
                        <TableCell>{item.tooth || "-"}</TableCell>
                        <TableCell>{item.specialty || "-"}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">R$ {item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {(item.subtotal ?? item.total_price).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="space-y-2 text-right">
                  <div className="flex justify-end gap-4 text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>R$ {quote.total_amount.toFixed(2)}</span>
                  </div>
                  {(quote.discount_percentage || quote.discount_amount) && (
                    <div className="flex justify-end gap-4 text-sm text-green-600">
                      <span>Desconto:</span>
                      <span>
                        {quote.discount_percentage
                          ? `${quote.discount_percentage}%`
                          : `R$ ${quote.discount_amount?.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-end gap-4 text-lg font-bold">
                    <span>Total:</span>
                    <span>R$ {quote.final_amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isAddingItems && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Adicionar procedimentos</CardTitle>
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
                              {procedures?.filter((proc) => proc.active).map((proc) => (
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
                            onChange={(event) => updateItem(index, "specialty", event.target.value)}
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
                            onChange={(event) => updateItem(index, "quantity", parseInt(event.target.value, 10) || 1)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Valor Unit.</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(event) => updateItem(index, "unit_price", parseFloat(event.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-6">
                          <label className="text-sm font-medium">
                            Subtotal: R$ {item.subtotal.toFixed(2)}
                          </label>
                        </div>
                      </div>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemRow(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button type="button" variant="outline" onClick={addItemRow}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingItems(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddItems}
                        disabled={addQuoteItems.isPending}
                      >
                        {addQuoteItems.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Salvar procedimentos
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payments */}
            {quote.quote_payments && quote.quote_payments.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Parcelas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quote.quote_payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.installment_number}ª</TableCell>
                          <TableCell>
                            {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {payment.payment_method
                              ? paymentMethodLabels[payment.payment_method] || payment.payment_method
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.status === "paid" ? "default" : "secondary"}>
                              {payment.status === "paid" ? "Pago" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">R$ {payment.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {quote.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 justify-end">
              {quote.status === "draft" && (
                <Button
                  onClick={() => handleStatusChange("sent")}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Marcar como Enviado
                </Button>
              )}
              {!["not_closed", "partially_closed", "closed"].includes(quote.status) && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange("not_closed")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Não fechou
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange("partially_closed")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Fechou parte
                  </Button>
                  <Button
                    onClick={() => handleStatusChange("closed")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Fechou tudo
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Orçamento não encontrado
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
