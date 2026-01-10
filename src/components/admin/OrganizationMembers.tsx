import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { toast } from 'sonner';
import { Loader2, Trash2, UserPlus } from 'lucide-react';

interface OrganizationMembersProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationMembers({ organizationId, open, onOpenChange }: OrganizationMembersProps) {
  const { getOrganizationMembers, addMember, removeMember } = useSuperAdmin();
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('usuario');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await getOrganizationMembers(organizationId);
      setMembers(data);
    } catch (error) {
      toast.error('Erro ao carregar membros', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [organizationId, open]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAdd = async () => {
    if (!email.trim()) {
      toast.error('Email obrigatório', {
        description: 'Por favor, informe o email do usuário.',
      });
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Email inválido', {
        description: 'Por favor, informe um email válido.',
      });
      return;
    }

    setIsAddingMember(true);
    try {
      await addMember(organizationId, email, role);
      toast.success('Membro adicionado com sucesso');
      setEmail('');
      setRole('usuario');
      await loadMembers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tente novamente';
      
      if (errorMessage.includes('not found') || errorMessage.includes('User not found')) {
        toast.error('Usuário não encontrado', {
          description: 'Este email não está cadastrado no sistema. O usuário precisa criar uma conta primeiro.',
        });
      } else {
        toast.error('Erro ao adicionar membro', {
          description: errorMessage,
        });
      }
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemove = async (userId: string, memberName: string) => {
    setRemovingMemberId(userId);
    try {
      await removeMember(organizationId, userId);
      toast.success('Membro removido com sucesso', {
        description: `${memberName} foi removido da organização.`,
      });
      await loadMembers();
    } catch (error) {
      toast.error('Erro ao remover membro', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      usuario: 'Usuário',
    };
    // Qualquer role legado será exibido como 'Usuário'
    return roles[role] || 'Usuário';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Membros da organização</DialogTitle>
          <DialogDescription>Gerencie os membros e suas permissões nesta organização.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2 md:grid-cols-4">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email do usuário"
              type="email"
              disabled={isAddingMember}
              className="md:col-span-2"
            />
            <Select value={role} onValueChange={setRole} disabled={isAddingMember}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="usuario">Usuário</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={isAddingMember}>
              {isAddingMember ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Adicionar
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Nenhum membro cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.profiles?.full_name || member.user_id}</TableCell>
                      <TableCell>{getRoleLabel(member.role)}</TableCell>
                      <TableCell>
                        <span className={member.active ? 'text-green-600' : 'text-muted-foreground'}>
                          {member.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={removingMemberId === member.user_id}
                            >
                              {removingMemberId === member.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover{' '}
                                <strong>{member.profiles?.full_name || 'este membro'}</strong> da
                                organização? Esta ação pode ser desfeita adicionando o membro novamente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleRemove(member.user_id, member.profiles?.full_name || 'Membro')
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
