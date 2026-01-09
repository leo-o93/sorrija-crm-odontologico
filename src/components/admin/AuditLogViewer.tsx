import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

export function AuditLogViewer() {
  const { auditLogs } = useSuperAdmin();

  return (
    <Card className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Alvo</TableHead>
            <TableHead>Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auditLogs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                Nenhum log encontrado.
              </TableCell>
            </TableRow>
          ) : (
            auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.created_at).toLocaleString('pt-BR')}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.target_type}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {JSON.stringify(log.details)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
