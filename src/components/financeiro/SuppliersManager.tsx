import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSuppliers, useCreateSupplier, useUpdateSupplier } from '@/hooks/useSuppliers';

export function SuppliersManager() {
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const { data: suppliers } = useSuppliers({ search, active: activeOnly });
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const [formState, setFormState] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    category: '',
    payment_terms: '',
    notes: '',
    active: true,
  });

  const openForm = (supplier?: any) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormState({
        name: supplier.name || '',
        document: supplier.document || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        category: supplier.category || '',
        payment_terms: supplier.payment_terms || '',
        notes: supplier.notes || '',
        active: supplier.active ?? true,
      });
    } else {
      setEditingSupplier(null);
      setFormState({
        name: '',
        document: '',
        phone: '',
        email: '',
        address: '',
        category: '',
        payment_terms: '',
        notes: '',
        active: true,
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (editingSupplier) {
      await updateSupplier.mutateAsync({ id: editingSupplier.id, ...formState });
    } else {
      await createSupplier.mutateAsync(formState);
    }
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
          <Input
            placeholder="Buscar fornecedor"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="md:max-w-xs"
          />
          <div className="flex items-center gap-2">
            <Switch checked={activeOnly} onCheckedChange={setActiveOnly} id="active-only" />
            <Label htmlFor="active-only">Ativos</Label>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Editar fornecedor' : 'Novo fornecedor'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Nome</Label>
                <Input value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} />
              </div>
              <div>
                <Label>CNPJ/CPF</Label>
                <Input value={formState.document} onChange={(e) => setFormState({ ...formState, document: e.target.value })} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={formState.phone} onChange={(e) => setFormState({ ...formState, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={formState.email} onChange={(e) => setFormState({ ...formState, email: e.target.value })} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={formState.category} onChange={(e) => setFormState({ ...formState, category: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Endereço</Label>
                <Input value={formState.address} onChange={(e) => setFormState({ ...formState, address: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Condições de pagamento</Label>
                <Input
                  value={formState.payment_terms}
                  onChange={(e) => setFormState({ ...formState, payment_terms: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Observações</Label>
                <Input value={formState.notes} onChange={(e) => setFormState({ ...formState, notes: e.target.value })} />
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

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(suppliers || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              suppliers?.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.category || '-'}</TableCell>
                  <TableCell>{supplier.email || supplier.phone || '-'}</TableCell>
                  <TableCell>{supplier.active ? 'Ativo' : 'Inativo'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openForm(supplier)}>
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
