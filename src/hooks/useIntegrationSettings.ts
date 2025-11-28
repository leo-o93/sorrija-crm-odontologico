import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IntegrationSettings {
  id: string;
  integration_type: string;
  settings: {
    evolution_base_url?: string;
    evolution_api_key?: string;
    evolution_instance?: string;
    webhook_secret?: string;
    n8n_outgoing_url?: string;
  };
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useIntegrationSettings(
  integrationType: string = 'whatsapp_evolution',
  organizationId?: string
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['integration-settings', integrationType, organizationId],
    queryFn: async () => {
      if (!organizationId) {
        return null;
      }

      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('integration_type', integrationType)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as IntegrationSettings | null;
    },
    enabled: !!organizationId,
  });

  return {
    settings: data,
    isLoading,
    error,
    refetch,
  };
}

export function useSaveIntegrationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      integrationType,
      settings,
      organizationId,
    }: {
      integrationType: string;
      settings: Record<string, any>;
      organizationId: string;
    }) => {
      const { data, error } = await supabase
        .from('integration_settings')
        .upsert({
          integration_type: integrationType,
          settings,
          active: true,
          organization_id: organizationId,
        }, {
          onConflict: 'organization_id,integration_type'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-settings'] });
      toast.success('Configurações salvas com sucesso');
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    },
  });
}
