import { RefreshCcw, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SystemStats } from '@/hooks/useSystemMonitoring';

interface WhatsAppStatusCardProps {
  stats: SystemStats;
  onReconnect?: () => void;
  onShowQr?: () => void;
}

export function WhatsAppStatusCard({ stats, onReconnect, onShowQr }: WhatsAppStatusCardProps) {
  const statusLabel = stats.whatsappStatus === 'connected'
    ? 'Conectado'
    : stats.whatsappStatus === 'connecting'
      ? 'Conectando'
      : stats.whatsappStatus === 'not_configured'
        ? 'Não configurado'
        : 'Desconectado';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Status do WhatsApp
          <Badge variant={stats.whatsappStatus === 'connected' ? 'default' : 'destructive'}>
            {statusLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Instância</p>
          <p className="text-base font-semibold">{stats.whatsappInstance || 'Não definida'}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onReconnect}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reconectar
          </Button>
          {stats.whatsappStatus !== 'connected' && (
            <Button size="sm" onClick={onShowQr}>
              <QrCode className="h-4 w-4 mr-2" />
              Ver QR Code
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
