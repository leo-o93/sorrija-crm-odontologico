import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAccountsPayable } from '@/hooks/useAccountsPayable';
import { useUpdateTransaction } from '@/hooks/useFinancialTransactions';

export function AccountsPayable() {
  const { data, isLoading } = useAccountsPayable();
  const updateTransaction = useUpdateTransaction();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((item) => {
      const matchesSearch =
        item.suppliers?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === 'all' ? true : item.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [data?.items, search, status]);

  const totals = useMemo(() => {
    const total = filtered.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const overdue = data?.grouped.overdue.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0;
    const upcoming = total - overdue;
    return { total, overdue, upcoming };
  }, [filtered, data?.grouped.overdue]);

  const handlePay = (id: string) => {
    updateTransaction.mutate({
      id,
      status: 'paid',
      payment_date: new Date().toISOString(),
    });
  };

  const getBadgeVariant = (dueDate?: string | null, itemStatus?: string) => {
    if (!dueDate) return 'secondary';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dueDate);
    date.setHours(0, 0, 0, 0);
    if (date < today || itemStatus === 'overdue') return 'destructive';
    const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'default';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
          <Input
            placeholder="Buscar por fornecedor ou descrição"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="md:max-w-xs"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total a pagar</p>
          <p className="text-2xl font-semibold">R$ {totals.total.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Vencido</p>
          <p className="text-2xl font-semibold text-destructive">R$ {totals.overdue.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">A vencer</p>
          <p className="text-2xl font-semibold text-emerald-500">R$ {totals.upcoming.toFixed(2)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma conta a pagar encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const dueDate = item.due_date ? format(new Date(item.due_date), 'dd/MM/yyyy') : 'Sem vencimento';
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const itemDueDate = item.due_date ? new Date(item.due_date) : null;
                if (itemDueDate) itemDueDate.setHours(0, 0, 0, 0);
                
                const isOverdue = itemDueDate ? itemDueDate < today : false;
                const diffDays = itemDueDate 
                  ? Math.floor((itemDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const isDueSoon = diffDays !== null && diffDays >= 0 && diffDays <= 7;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.suppliers?.name || 'Não informado'}</TableCell>
                    <TableCell>{item.expense_categories?.name || '-'}</TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                    <TableCell>{dueDate}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(item.due_date, item.status)}>
                        {isOverdue ? 'Vencido' : item.status === 'scheduled' ? 'Agendado' : 'Pendente'}
                      </Badge>
                      {isDueSoon && !isOverdue && (
                        <span className="ml-2 text-xs text-yellow-600 inline-flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Próximo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">R$ {Number(item.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePay(item.id)}
                        disabled={item.status === 'paid'}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Pagar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
