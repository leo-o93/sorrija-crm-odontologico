import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useUpdateTransaction } from '@/hooks/useFinancialTransactions';

export function AccountsReceivable() {
  const { data } = useAccountsReceivable();
  const updateTransaction = useUpdateTransaction();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((item) => {
      const matchesSearch =
        item.patients?.name?.toLowerCase().includes(search.toLowerCase()) ||
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

  const handleSetPaid = (id: string) => {
    updateTransaction.mutate({
      id,
      status: 'paid',
      payment_date: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
          <Input
            placeholder="Buscar por paciente ou descrição"
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
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total a receber</p>
          <p className="text-2xl font-semibold">R$ {totals.total.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Vencido</p>
          <p className="text-2xl font-semibold text-red-500">R$ {totals.overdue.toFixed(2)}</p>
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
              <TableHead>Paciente</TableHead>
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
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhuma conta a receber encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const dueDate = item.due_date ? format(new Date(item.due_date), 'dd/MM/yyyy') : '-';
                const isOverdue = item.due_date ? new Date(item.due_date) < new Date() : false;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.patients?.name || 'Não informado'}</TableCell>
                    <TableCell>{item.description || item.quotes?.quote_number || '-'}</TableCell>
                    <TableCell>{dueDate}</TableCell>
                    <TableCell>
                      <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">R$ {Number(item.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetPaid(item.id)}
                        disabled={item.status === 'paid'}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Baixar
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
