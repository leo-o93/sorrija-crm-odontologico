import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  useRecurringPayments,
  useCreateRecurringPayment,
  useUpdateRecurringPayment,
  useGenerateRecurringTransactions,
} from '@/hooks/useRecurringPayments';

const frequencyOptions = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

export function RecurringPaymentsManager() {
  const { data: recurringPayments } = useRecurringPayments();
  const createRecurring = useCreateRecurringPayment();
  const updateRecurring = useUpdateRecurringPayment();
  const generateTransactions = useGenerateRecurringTransactions();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [formState, setFormState] = useState({
    description: '',
    amount: 0,
    frequency: 'monthly',
    day_of_month: 1,
    start_date: '',
    end_date: '',
    next_due_date: '',
    active: true,
  });

  const openForm = (item?: any) => {
    if (item) {
      setEditing(item);
      setFormState({
        description: item.description || '',
        amount: Number(item.amount || 0),
        frequency: item.frequency || 'monthly',
        day_of_month: item.day_of_month || 1,
        start_date: item.start_date || '',
        end_date: item.end_date || '',
        next_due_date: item.next_due_date || '',
        active: item.active ?? true,
      });
    } else {
      setEditing(null);
      setFormState({
        description: '',
        amount: 0,
        frequency: 'monthly',
        day_of_month: 1,
        start_date: '',
        end_date: '',
        next_due_date: '',
        active: true,
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateRecurring.mutateAsync({ id: editing.id, ...formState });
    } else {
      await createRecurring.mutateAsync(formState);
    }
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pagamentos recorrentes</h3>
          <p className="text-sm text-muted-foreground">Gerencie despesas fixas e recorrências.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generateTransactions.mutate()}>
            Gerar transações
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova recorrência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar recorrência' : 'Nova recorrência'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Descrição</Label>
                  <Input value={formState.description} onChange={(e) => setFormState({ ...formState, description: e.target.value })} />
                </div>
                <div>
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    value={formState.amount}
                    onChange={(e) => setFormState({ ...formState, amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Frequência</Label>
                  <Select
                    value={formState.frequency}
                    onValueChange={(value) => setFormState({ ...formState, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dia do vencimento</Label>
                  <Input
                    type="number"
                    value={formState.day_of_month}
                    onChange={(e) => setFormState({ ...formState, day_of_month: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Início</Label>
                  <Input
                    type="date"
                    value={formState.start_date}
                    onChange={(e) => setFormState({ ...formState, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input
                    type="date"
                    value={formState.end_date}
                    onChange={(e) => setFormState({ ...formState, end_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Próximo vencimento</Label>
                  <Input
                    type="date"
                    value={formState.next_due_date}
                    onChange={(e) => setFormState({ ...formState, next_due_date: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formState.active} onCheckedChange={(checked) => setFormState({ ...formState, active: checked })} />
                  <Label>Ativo</Label>
                </div>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSubmit}>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead>Próximo vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(recurringPayments || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhuma recorrência cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              recurringPayments?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell>{item.frequency}</TableCell>
                  <TableCell>{item.next_due_date}</TableCell>
                  <TableCell>{item.active ? 'Ativa' : 'Pausada'}</TableCell>
                  <TableCell className="text-right">R$ {Number(item.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openForm(item)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
