import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface UserWithOrgs {
  id: string;
  full_name: string;
  role: string;
  active: boolean;
  created_at: string;
  organizations: { name: string; role: string }[];
}

export function GlobalUsersManager() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users-with-orgs'],
    queryFn: async () => {
      // Buscar todos os perfis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role, active, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar membros de organizações com nome da organização
      const { data: memberships, error: membersError } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          organizations:organization_id (name)
        `);

      if (membersError) throw membersError;

      // Combinar dados
      const usersWithOrgs: UserWithOrgs[] = (profiles || []).map((profile) => {
        const userMemberships = (memberships || [])
          .filter((m) => m.user_id === profile.id)
          .map((m) => ({
            name: (m.organizations as any)?.name || 'Desconhecida',
            role: m.role,
          }));

        return {
          ...profile,
          organizations: userMemberships,
        };
      });

      return usersWithOrgs;
    },
  });

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      usuario: 'Usuário',
    };
    // Qualquer role legado será exibido como 'Usuário'
    return roles[role] || 'Usuário';
  };

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Role Global</TableHead>
            <TableHead>Organizações</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data || []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            data?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name || user.id}</TableCell>
                <TableCell>{getRoleLabel(user.role)}</TableCell>
                <TableCell>
                  {user.organizations.length === 0 ? (
                    <span className="text-muted-foreground text-sm">Nenhuma</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.organizations.map((org, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {org.name} ({getRoleLabel(org.role)})
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className={user.active ? 'text-green-600' : 'text-muted-foreground'}>
                    {user.active ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString('pt-BR')}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
