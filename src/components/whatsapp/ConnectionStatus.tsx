import { useState } from 'react';
import { useEvolutionAPI } from '@/hooks/useEvolutionAPI';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Smartphone, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectionStatus() {
  const { connectionState, refetchConnectionState, fetchQRCode, isConfigured } = useEvolutionAPI();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);

  // O hook useEvolutionAPI já faz refresh a cada 30 segundos via refetchInterval

  const handleGetQRCode = async () => {
    setIsLoadingQR(true);
    try {
      const result = await fetchQRCode();
      setQrCode(result.base64);
      toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
    } catch (error) {
      toast.error('Erro ao gerar QR Code');
      console.error(error);
    } finally {
      setIsLoadingQR(false);
    }
  };

  if (!isConfigured) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Smartphone className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">WhatsApp não configurado</p>
            <p className="text-sm text-muted-foreground">
              Configure as credenciais da Evolution API abaixo
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Suporta tanto resposta direta (connectionState.state) quanto aninhada (connectionState.instance.state)
  const state = connectionState?.instance?.state || (connectionState as any)?.state;
  const isConnected = state === 'open';
  const isConnecting = state === 'connecting';
  const isDisconnected = state === 'close' || !state;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5" />
            <div>
              <p className="font-medium">Status da Conexão WhatsApp</p>
              <p className="text-sm text-muted-foreground">
                Instância configurada e monitorada
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchConnectionState()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {isConnected && (
            <Badge variant="default" className="bg-green-500">
              🟢 Conectado
            </Badge>
          )}
          {isConnecting && (
            <Badge variant="secondary">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Conectando...
            </Badge>
          )}
          {isDisconnected && (
            <Badge variant="destructive">
              🔴 Desconectado
            </Badge>
          )}
        </div>

        {isDisconnected && (
          <div className="space-y-3 pt-4 border-t">
            <Button
              onClick={handleGetQRCode}
              disabled={isLoadingQR}
              className="w-full"
            >
              {isLoadingQR ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando QR Code...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Gerar QR Code para Conectar
                </>
              )}
            </Button>

            {qrCode && (
              <div className="flex flex-col items-center gap-2 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Escaneie com seu WhatsApp:</p>
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64 border-4 border-background rounded-lg"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Abra o WhatsApp → Aparelhos conectados → Conectar um aparelho
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
