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
  amount: z.string().min(1, "Valor é obrigatório"),
  description: z.string().optional(),
  transaction_date: z.string().min(1, "Data é obrigatória"),
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
    await createTransaction.mutateAsync({
      ...data,
      amount: parseFloat(data.amount),
    });
    form.reset();
    onSuccess?.();
  };

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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.map((category) => (
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
              <FormLabel>Forma de Pagamento</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods?.map((method) => (
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
