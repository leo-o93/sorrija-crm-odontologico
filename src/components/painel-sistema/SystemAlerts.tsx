import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SystemAlert } from '@/hooks/useSystemMonitoring';

interface SystemAlertsProps {
  alerts: SystemAlert[];
  onDismiss?: (id: string) => void;
}

export function SystemAlerts({ alerts, onDismiss }: SystemAlertsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas do Sistema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum alerta crítico.</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="flex items-start justify-between gap-3 border-b pb-3">
              <div>
                <Badge variant={alert.level === 'error' ? 'destructive' : 'default'}>
                  {alert.level.toUpperCase()}
                </Badge>
                <p className="text-sm font-medium mt-2">{alert.message}</p>
                <p className="text-xs text-muted-foreground">{alert.source}</p>
              </div>
              {onDismiss && (
                <Button variant="ghost" size="sm" onClick={() => onDismiss(alert.id)}>
                  Dispensar
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
