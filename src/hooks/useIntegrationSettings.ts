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

export function useIntegrationSettings(integrationType: string = 'whatsapp_evolution') {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['integration-settings', integrationType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('integration_type', integrationType)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as IntegrationSettings | null;
    },
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
    }: {
      integrationType: string;
      settings: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('integration_settings')
        .upsert({
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
