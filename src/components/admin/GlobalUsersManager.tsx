import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

export function GlobalUsersManager() {
  const { users, resetUserPassword, setUserBlocked } = useSuperAdmin();

  return (
    <Card className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Organizações</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(users || []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name || user.id}</TableCell>
                <TableCell>{user.email || '-'}</TableCell>
                <TableCell>
                  {user.organizations.length > 0
                    ? user.organizations.map((org) => `${org.organization_name || org.organization_id} (${org.role})`).join(', ')
                    : '-'}
                </TableCell>
                <TableCell>{user.banned_until ? 'Bloqueado' : 'Ativo'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const link = await resetUserPassword(user.id);
                        if (link) {
                          navigator.clipboard.writeText(link);
                        }
                      }}
                    >
                      Resetar senha
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUserBlocked(user.id, !user.banned_until)}
                    >
                      {user.banned_until ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
