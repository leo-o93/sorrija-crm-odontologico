import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemStats } from '@/hooks/useSystemMonitoring';

interface OperationalMetricsProps {
  stats: SystemStats;
}

export function OperationalMetrics({ stats }: OperationalMetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas operacionais do dia</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Leads convertidos</p>
          <p className="text-2xl font-semibold">{stats.leadsCount.hot}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Mensagens enviadas/recebidas</p>
          <p className="text-2xl font-semibold">{stats.messagesToday}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Conversas abertas</p>
          <p className="text-2xl font-semibold">{stats.conversationsCount.open}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Webhooks 24h</p>
          <p className="text-2xl font-semibold">{stats.webhooksLast24h}</p>
        </div>
      </CardContent>
    </Card>
  );
}
