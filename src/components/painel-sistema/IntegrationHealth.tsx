import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SystemStats } from '@/hooks/useSystemMonitoring';

interface IntegrationHealthProps {
  stats: SystemStats;
}

export function IntegrationHealth({ stats }: IntegrationHealthProps) {
  const getBadgeVariant = (status: string) => {
    if (status === 'connected') return 'default';
    if (status === 'connecting') return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saúde das integrações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">WhatsApp Evolution API</p>
            <p className="text-xs text-muted-foreground">Instância: {stats.whatsappInstance || 'N/D'}</p>
          </div>
          <Badge variant={getBadgeVariant(stats.whatsappStatus)}>{stats.whatsappStatus}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Edge Functions</p>
            <p className="text-xs text-muted-foreground">Última execução bem-sucedida</p>
          </div>
          <Badge variant="secondary">Monitorando</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
