import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

interface OrganizationMembersProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationMembers({ organizationId, open, onOpenChange }: OrganizationMembersProps) {
  const { getOrganizationMembers, addMember, removeMember } = useSuperAdmin();
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('recepcao');

  useEffect(() => {
    if (open) {
      getOrganizationMembers(organizationId).then(setMembers);
    }
  }, [getOrganizationMembers, organizationId, open]);

  const handleAdd = async () => {
    await addMember(organizationId, email, role);
    setEmail('');
    setRole('recepcao');
    const updated = await getOrganizationMembers(organizationId);
    setMembers(updated);
  };

  const handleRemove = async (userId: string) => {
    await removeMember(organizationId, userId);
    const updated = await getOrganizationMembers(organizationId);
    setMembers(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Membros da organização</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2 md:grid-cols-3">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="recepcao">Recepção</SelectItem>
                <SelectItem value="dentista">Dentista</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd}>Adicionar</Button>
          </div>

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
                    <TableCell>{member.role}</TableCell>
                    <TableCell>{member.active ? 'Ativo' : 'Inativo'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(member.user_id)}>
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
