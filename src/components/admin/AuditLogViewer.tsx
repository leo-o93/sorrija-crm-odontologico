import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { ChevronDown, ChevronRight } from 'lucide-react';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create_organization: { label: 'Criou organização', color: 'bg-green-500/10 text-green-700' },
  update_organization: { label: 'Atualizou organização', color: 'bg-blue-500/10 text-blue-700' },
  delete_organization: { label: 'Desativou organização', color: 'bg-red-500/10 text-red-700' },
  add_member: { label: 'Adicionou membro', color: 'bg-green-500/10 text-green-700' },
  remove_member: { label: 'Removeu membro', color: 'bg-orange-500/10 text-orange-700' },
  create_admin: { label: 'Criou administrador', color: 'bg-purple-500/10 text-purple-700' },
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  organization: 'Organização',
  member: 'Membro',
  user: 'Usuário',
};

export function AuditLogViewer() {
  const { auditLogs } = useSuperAdmin();
  const [search, setSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    const searchLower = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.target_type.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower)
    );
  });

  const formatDetails = (details: Record<string, unknown>) => {
    const entries = Object.entries(details);
    if (entries.length === 0) return null;

    return (
      <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="font-medium text-muted-foreground">{key}:</span>
            <span className="text-foreground">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const getActionInfo = (action: string) => {
    return ACTION_LABELS[action] || { label: action, color: 'bg-gray-500/10 text-gray-700' };
  };

  return (
    <Card className="p-4 space-y-4">
      <Input
        placeholder="Buscar nos logs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Alvo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLogs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                Nenhum log encontrado.
              </TableCell>
            </TableRow>
          ) : (
            filteredLogs.map((log) => {
              const actionInfo = getActionInfo(log.action);
              const isExpanded = expandedLogId === log.id;
              const hasDetails = Object.keys(log.details || {}).length > 0;

              return (
                <>
                  <TableRow
                    key={log.id}
                    className={hasDetails ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => hasDetails && setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    <TableCell className="w-8">
                      {hasDetails && (
                        isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={actionInfo.color}>
                        {actionInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{TARGET_TYPE_LABELS[log.target_type] || log.target_type}</TableCell>
                  </TableRow>
                  {isExpanded && hasDetails && (
                    <TableRow key={`${log.id}-details`}>
                      <TableCell colSpan={4} className="bg-muted/20">
                        {formatDetails(log.details)}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
