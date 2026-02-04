import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useCreateTransaction } from "@/hooks/useFinancialTransactions";

const transactionSchema = z.object({
  type: z.enum(["receita", "despesa"]),
  category_id: z.string().min(1, "Selecione uma categoria"),
  payment_method_id: z.string().optional(),
  amount: z
    .string()
    .min(1, "Valor é obrigatório")
    .refine((value) => Number(value) > 0, "O valor deve ser positivo"),
  fee_percent: z.string().optional(),
  discount_value: z.string().optional(),
  description: z.string().optional(),
  transaction_date: z
    .string()
    .min(1, "Data é obrigatória")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida"),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSuccess?: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [transactionType, setTransactionType] = useState<"receita" | "despesa">("receita");
  const { data: categories } = useExpenseCategories(transactionType);
  const { data: paymentMethods } = usePaymentMethods();
  const createTransaction = useCreateTransaction();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "receita",
      status: "paid",
      transaction_date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: TransactionFormValues) => {
    const amount = parseFloat(data.amount);
    const feePercent = data.fee_percent ? parseFloat(data.fee_percent) : 0;
    const discountValue = data.discount_value ? parseFloat(data.discount_value) : 0;
    const feeValue = amount * (feePercent / 100);
    const netValue = amount - feeValue - discountValue;

    await createTransaction.mutateAsync({
      ...data,
      amount,
      fee_percent: feePercent || null,
      fee_value: feeValue || null,
      discount_value: discountValue || null,
      net_value: Number.isFinite(netValue) ? netValue : amount,
    });
    form.reset();
    onSuccess?.();
  };

  const watchedAmount = form.watch("amount");
  const watchedFeePercent = form.watch("fee_percent");
  const watchedDiscount = form.watch("discount_value");
  const parsedAmount = watchedAmount ? parseFloat(watchedAmount) : 0;
  const parsedFeePercent = watchedFeePercent ? parseFloat(watchedFeePercent) : 0;
  const parsedDiscount = watchedDiscount ? parseFloat(watchedDiscount) : 0;
  const calculatedFee = parsedAmount * (parsedFeePercent / 100);
  const calculatedNet = parsedAmount - calculatedFee - parsedDiscount;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setTransactionType(value as "receita" | "despesa");
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.filter(cat => cat.id && cat.id.trim() !== "").map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fee_percent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taxa da máquina (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discount_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desconto (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Taxa calculada</span>
            <span>R$ {Number.isFinite(calculatedFee) ? calculatedFee.toFixed(2) : "0.00"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Valor líquido</span>
            <span className="font-medium text-foreground">
              R$ {Number.isFinite(calculatedNet) ? calculatedNet.toFixed(2) : "0.00"}
            </span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="transaction_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_method_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma de Pagamento (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods?.filter(method => method.id && method.id.trim() !== "").map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Descrição da transação" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Observações adicionais" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Salvar Transação
        </Button>
      </form>
    </Form>
  );
}
