import { useMemo, useState } from 'react';
import { Pencil, Users, Loader2, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { OrganizationForm } from '@/components/admin/OrganizationForm';
import { OrganizationMembers } from '@/components/admin/OrganizationMembers';
import { toast } from 'sonner';

export function OrganizationsTable() {
  const { organizations, createOrganization, updateOrganization, deleteOrganization } = useSuperAdmin();
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [membersOrgId, setMembersOrgId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deactivatingOrgId, setDeactivatingOrgId] = useState<string | null>(null);

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

    setIsSubmitting(true);
    try {
      if (selectedOrg) {
        await updateOrganization(selectedOrg.id, payload);
        toast.success('Organização atualizada com sucesso');
      } else {
        const result = await createOrganization(payload);
        
        if (result?.adminCreated) {
          toast.success(
            `Administrador criado: ${result.adminCreated.email}`,
            { description: 'O usuário pode fazer login com as credenciais fornecidas.' }
          );
        } else if (result?.adminError) {
          toast.warning('Organização criada, mas houve erro ao criar o admin', {
            description: result.adminError
          });
        } else {
          toast.success('Organização criada com sucesso');
        }
      }

      setIsDialogOpen(false);
      setSelectedOrg(null);
    } catch (error) {
      toast.error(selectedOrg ? 'Erro ao atualizar organização' : 'Erro ao criar organização', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (orgId: string, orgName: string) => {
    setDeactivatingOrgId(orgId);
    try {
      await deleteOrganization(orgId);
      toast.success('Organização desativada', {
        description: `${orgName} foi desativada com sucesso.`,
      });
    } catch (error) {
      toast.error('Erro ao desativar organização', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setDeactivatingOrgId(null);
    }
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
              <DialogDescription>
                {selectedOrg ? 'Edite as informações da organização abaixo.' : 'Preencha os dados para criar uma nova organização.'}
              </DialogDescription>
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
              isSubmitting={isSubmitting}
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
                <TableCell>
                  <span className={org.active ? 'text-green-600' : 'text-muted-foreground'}>
                    {org.active ? 'Ativa' : 'Inativa'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedOrg(org);
                        setIsDialogOpen(true);
                      }}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMembersOrgId(org.id)}
                      title="Gerenciar membros"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    {org.active && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deactivatingOrgId === org.id}
                            title="Desativar"
                          >
                            {deactivatingOrgId === org.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Power className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar desativação</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja desativar a organização{' '}
                              <strong>{org.name}</strong>? Os membros não poderão mais acessar os
                              dados desta organização.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeactivate(org.id, org.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Desativar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
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
