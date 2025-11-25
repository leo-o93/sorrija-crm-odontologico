import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface IntegrationSettings {
  id: string;
  organization_id: string;
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

export function useIntegrationSettings(integrationType: string = 'whatsapp_evolution') {
  const { currentOrganization } = useOrganization();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['integration-settings', currentOrganization?.id, integrationType],
    queryFn: async () => {
      if (!currentOrganization) return null;

      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('integration_type', integrationType)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as IntegrationSettings | null;
    },
    enabled: !!currentOrganization,
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
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({
      integrationType,
      settings,
    }: {
      integrationType: string;
      settings: Record<string, any>;
    }) => {
      if (!currentOrganization) throw new Error('No organization selected');

      const { data, error } = await supabase
        .from('integration_settings')
        .upsert({
          organization_id: currentOrganization.id,
          integration_type: integrationType,
          settings,
          active: true,
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
