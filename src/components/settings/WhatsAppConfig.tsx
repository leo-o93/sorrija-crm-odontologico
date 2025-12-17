import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useIntegrationSettings, useSaveIntegrationSettings } from '@/hooks/useIntegrationSettings';
import { useEvolutionAPI } from '@/hooks/useEvolutionAPI';
import { ConnectionStatus } from '@/components/whatsapp/ConnectionStatus';
import { Loader2, Copy, Check, Download, History } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2 } from 'lucide-react';

export function WhatsAppConfig() {
  const { currentOrganization } = useOrganization();
  const { settings, isLoading, refetch } = useIntegrationSettings('whatsapp_evolution', currentOrganization?.id);
  const saveSettings = useSaveIntegrationSettings();
  const { syncContacts, syncAllMessages, testConnection, registerWebhook, isConfigured } = useEvolutionAPI();

  const [formData, setFormData] = useState({
    evolution_base_url: '',
    evolution_api_key: '',
    evolution_instance: '',
    webhook_secret: '',
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (settings?.settings) {
      setFormData({
        evolution_base_url: settings.settings.evolution_base_url || '',
        evolution_api_key: settings.settings.evolution_api_key || '',
        evolution_instance: settings.settings.evolution_instance || '',
        webhook_secret: settings.settings.webhook_secret || '',
      });
    }
  }, [settings]);

  const handleGenerateToken = () => {
    const token = crypto.randomUUID();
    setFormData({ ...formData, webhook_secret: token });
  };

  const handleSave = async () => {
    if (!currentOrganization?.id) {
      toast.error('Nenhuma organização selecionada');
      return;
    }

    // Clean URL before saving (remove /manager/ if present)
    const cleanedData = {
      ...formData,
      evolution_base_url: formData.evolution_base_url.replace(/\/manager\/?$/, '')
    };
    
    const previousInstance = settings?.settings?.evolution_instance;
    const newInstance = cleanedData.evolution_instance;
    
    await saveSettings.mutateAsync({
      integrationType: 'whatsapp_evolution',
      settings: cleanedData,
      organizationId: currentOrganization.id,
    });

    // Refetch settings to update context
    await refetch();
    
    // Se a instância mudou, sincronizar histórico automaticamente
    if (previousInstance && previousInstance !== newInstance) {
      toast.info('Instância alterada. Sincronizando histórico...');
      setTimeout(() => {
        syncAllMessages.mutate();
      }, 1000);
    }
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-incoming`;

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('URL copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {currentOrganization && (
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            Configurando WhatsApp para: <strong>{currentOrganization.name}</strong> 
            {currentOrganization.evolution_instance && (
              <span className="text-muted-foreground ml-2">
                (Instância: {currentOrganization.evolution_instance})
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <ConnectionStatus />
      
      <Card>
        <CardHeader>
          <CardTitle>Configuração WhatsApp / Evolution API</CardTitle>
          <CardDescription>
            Configure a integração com Evolution API para receber e enviar mensagens do WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="evolution_base_url">URL Base da Evolution API</Label>
            <Input
              id="evolution_base_url"
              placeholder="https://api.evolution.exemplo.com"
              value={formData.evolution_base_url}
              onChange={(e) => setFormData({ ...formData, evolution_base_url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evolution_api_key">API Key da Evolution</Label>
            <Input
              id="evolution_api_key"
              type="password"
              placeholder="Sua API Key"
              value={formData.evolution_api_key}
              onChange={(e) => setFormData({ ...formData, evolution_api_key: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evolution_instance">Nome da Instância</Label>
            <Input
              id="evolution_instance"
              placeholder="sorrija_main"
              value={formData.evolution_instance}
              onChange={(e) => setFormData({ ...formData, evolution_instance: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_secret">Token Secreto do Webhook</Label>
            <div className="flex gap-2">
              <Input
                id="webhook_secret"
                type="password"
                placeholder="Token para validar webhooks"
                value={formData.webhook_secret}
                onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
              />
              <Button type="button" variant="outline" onClick={handleGenerateToken}>
                Gerar
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saveSettings.isPending}>
              {saveSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Configurações
            </Button>
            
            {isConfigured && (
              <>
                <Button
                  variant="outline"
                  onClick={() => testConnection.mutate()}
                  disabled={testConnection.isPending}
                >
                  {testConnection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Testar Conexão
                </Button>

                <Button
                  variant="outline"
                  onClick={() => registerWebhook.mutate()}
                  disabled={registerWebhook.isPending}
                >
                  {registerWebhook.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Webhook
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => syncContacts.mutate()}
                  disabled={syncContacts.isPending}
                >
                  {syncContacts.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Sincronizar Contatos
                </Button>

                <Button
                  variant="outline"
                  onClick={() => syncAllMessages.mutate()}
                  disabled={syncAllMessages.isPending}
                >
                  {syncAllMessages.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <History className="mr-2 h-4 w-4" />
                  )}
                  Sincronizar Histórico
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {formData.webhook_secret && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Webhook</CardTitle>
            <CardDescription>
              Informações para configurar o webhook na Evolution API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL do Webhook</Label>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyWebhookUrl}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Header de Autenticação</Label>
              <code className="block p-3 bg-muted rounded text-sm">
                x-webhook-token: {formData.webhook_secret}
              </code>
            </div>

            <div className="p-4 bg-accent rounded-lg text-sm space-y-2">
              <p className="font-medium">Instruções:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Use o botão "Registrar Webhook" acima para configurar automaticamente</li>
                <li>Ou configure manualmente na Evolution API com a URL e header acima</li>
                <li>Certifique-se de que o evento MESSAGES_UPSERT está habilitado</li>
                <li>Desabilite a opção "Webhook Base64" na Evolution</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
