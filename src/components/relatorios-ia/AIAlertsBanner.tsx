import { AlertTriangle, Clock, Flame } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIAlertsBannerProps {
  leadsWithoutResponse24h: number;
  hotLeadsWithoutResponseToday: number;
}

export function AIAlertsBanner({ leadsWithoutResponse24h, hotLeadsWithoutResponseToday }: AIAlertsBannerProps) {
  const hasAlerts = leadsWithoutResponse24h > 0 || hotLeadsWithoutResponseToday > 0;

  if (!hasAlerts) {
    return (
      <Alert className="bg-success/10 border-success/30">
        <AlertDescription className="flex items-center gap-2 text-success">
          ✅ Todos os leads estão sendo atendidos corretamente!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {hotLeadsWithoutResponseToday > 0 && (
        <Alert className="bg-destructive/10 border-destructive/30">
          <Flame className="h-4 w-4 text-destructive" />
          <AlertDescription className="flex items-center gap-2">
            <span className="font-medium text-destructive">
              {hotLeadsWithoutResponseToday} leads quentes
            </span>
            <span className="text-muted-foreground">
              sem resposta hoje - prioridade máxima!
            </span>
          </AlertDescription>
        </Alert>
      )}
      
      {leadsWithoutResponse24h > 0 && (
        <Alert className="bg-warning/10 border-warning/30">
          <Clock className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center gap-2">
            <span className="font-medium text-warning">
              {leadsWithoutResponse24h} leads
            </span>
            <span className="text-muted-foreground">
              sem interação há mais de 24 horas
            </span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
