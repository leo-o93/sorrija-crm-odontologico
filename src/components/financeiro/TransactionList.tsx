import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinancialTransactions, useDeleteTransaction } from "@/hooks/useFinancialTransactions";
import { Trash2, Calendar } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

export function TransactionList() {
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: transactions, isLoading } = useFinancialTransactions({
    startDate,
    endDate,
    type: typeFilter,
    status: statusFilter,
  });

  const deleteTransaction = useDeleteTransaction();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const statusLabels = {
    paid: "Pago",
    pending: "Pendente",
    overdue: "Vencido",
    cancelled: "Cancelado",
  };

  const statusColors = {
    paid: "bg-green-500",
    pending: "bg-yellow-500",
    overdue: "bg-red-500",
    cancelled: "bg-gray-500",
  };

  if (isLoading) {
    return <div>Carregando transações...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2 items-center">
          <Calendar className="h-4 w-4" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <span>até</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="receita">Receita</SelectItem>
            <SelectItem value="despesa">Despesa</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Forma Pagamento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Líquido</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions?.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {format(new Date(transaction.transaction_date), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                <Badge variant={transaction.type === "receita" ? "default" : "secondary"}>
                  {transaction.type === "receita" ? "Receita" : "Despesa"}
                </Badge>
              </TableCell>
              <TableCell>{transaction.expense_categories?.name || "-"}</TableCell>
              <TableCell>{transaction.description || "-"}</TableCell>
              <TableCell>{transaction.payment_methods?.name || "-"}</TableCell>
              <TableCell className={transaction.type === "receita" ? "text-green-600" : "text-red-600"}>
                R$ {Number(transaction.amount).toFixed(2)}
              </TableCell>
              <TableCell>
                R$ {(transaction.net_value ?? transaction.amount).toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[transaction.status]}>
                  {statusLabels[transaction.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(transaction.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteTransaction.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Excluir Transação"
        description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
