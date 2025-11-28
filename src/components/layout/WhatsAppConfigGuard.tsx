import { useIntegrationSettings } from '@/hooks/useIntegrationSettings';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface WhatsAppConfigGuardProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

export function WhatsAppConfigGuard({ 
  children, 
  fallbackMessage = 'Esta funcionalidade requer que o WhatsApp esteja configurado.' 
}: WhatsAppConfigGuardProps) {
  const { currentOrganization, isLoading: orgLoading } = useOrganization();
  const { settings, isLoading: settingsLoading } = useIntegrationSettings(
    'whatsapp_evolution',
    currentOrganization?.id
  );
  
  const isLoading = orgLoading || settingsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Check if WhatsApp is configured properly
  const isConfigured = Boolean(
    settings?.active &&
    settings?.settings?.evolution_base_url &&
    settings?.settings?.evolution_api_key &&
    settings?.settings?.evolution_instance
  );

  if (!isConfigured) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Alert className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuração Necessária</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{fallbackMessage}</p>
            <p className="text-sm">
              Configure a integração com o WhatsApp Evolution API nas configurações para
              utilizar esta funcionalidade.
            </p>
            <Button asChild>
              <Link to="/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                Ir para Configurações
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}