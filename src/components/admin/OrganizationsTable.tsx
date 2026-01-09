import { useMemo, useState } from 'react';
import { Pencil, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { OrganizationForm } from '@/components/admin/OrganizationForm';
import { OrganizationMembers } from '@/components/admin/OrganizationMembers';

export function OrganizationsTable() {
  const { organizations, createOrganization, updateOrganization, deleteOrganization } = useSuperAdmin();
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [membersOrgId, setMembersOrgId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    return organizations.filter((org) => org.name?.toLowerCase().includes(search.toLowerCase()));
  }, [organizations, search]);

  const handleSubmit = async (values: any) => {
    let settings = {};
    try {
      settings = values.settings ? JSON.parse(values.settings) : {};
    } catch (error) {
      settings = {};
    }

    const payload = {
      ...values,
      settings,
    };

    if (selectedOrg) {
      await updateOrganization(selectedOrg.id, payload);
    } else {
      await createOrganization(payload);
    }

    setIsDialogOpen(false);
    setSelectedOrg(null);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar organização"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="md:max-w-xs"
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedOrg(null)}>Nova organização</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{selectedOrg ? 'Editar organização' : 'Nova organização'}</DialogTitle>
            </DialogHeader>
            <OrganizationForm
              initialValues={
                selectedOrg
                  ? {
                      name: selectedOrg.name,
                      evolution_instance: selectedOrg.evolution_instance || '',
                      settings: JSON.stringify(selectedOrg.settings || {}),
                      active: selectedOrg.active ?? true,
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Instância</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                Nenhuma organização encontrada.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell>{org.evolution_instance || '-'}</TableCell>
                <TableCell>{org.active ? 'Ativa' : 'Inativa'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedOrg(org);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setMembersOrgId(org.id)}>
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteOrganization(org.id)}>
                      Desativar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {membersOrgId && (
        <OrganizationMembers
          organizationId={membersOrgId}
          open={!!membersOrgId}
          onOpenChange={(open) => !open && setMembersOrgId(null)}
        />
      )}
    </Card>
  );
}
