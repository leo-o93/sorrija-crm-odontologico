import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface CRMSettings {
  id: string;
  organization_id: string;
  
  // Configurações de temperatura automática - NOVO → FRIO
  new_to_cold_minutes: number;
  
  // Configurações de temperatura automática - QUENTE → FRIO
  hot_to_cold_days: number;
  hot_to_cold_hours: number;
  enable_auto_temperature: boolean;
  
  // Configurações de substatus quente
  awaiting_response_minutes: number;
  enable_auto_substatus: boolean;
  em_conversa_timeout_minutes: number;
  enable_substatus_timeout: boolean;
  aguardando_to_cold_hours: number;
  
  // Configurações de follow-up
  max_follow_up_attempts: number;
  default_follow_up_interval: number;
  
  // Configurações de automação
  enable_automation: boolean;
  automation_mode: 'manual' | 'semi_auto' | 'full_auto';
  use_ai_for_unmatched: boolean;
  
  // Notificações
  enable_follow_up_alerts: boolean;
  enable_cold_lead_alerts: boolean;
  enable_no_show_alerts: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface UpdateCRMSettingsInput {
  new_to_cold_minutes?: number;
  hot_to_cold_days?: number;
  hot_to_cold_hours?: number;
  enable_auto_temperature?: boolean;
  awaiting_response_minutes?: number;
  enable_auto_substatus?: boolean;
  em_conversa_timeout_minutes?: number;
  enable_substatus_timeout?: boolean;
  aguardando_to_cold_hours?: number;
  max_follow_up_attempts?: number;
  default_follow_up_interval?: number;
  enable_automation?: boolean;
  automation_mode?: 'manual' | 'semi_auto' | 'full_auto';
  use_ai_for_unmatched?: boolean;
  enable_follow_up_alerts?: boolean;
  enable_cold_lead_alerts?: boolean;
  enable_no_show_alerts?: boolean;
}

export function useCRMSettings() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ["crm_settings", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;

      const { data, error } = await supabase
        .from("crm_settings")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .maybeSingle();

      if (error) throw error;
      
      // Se não existir, retornar valores padrão
      if (!data) {
        return {
          id: '',
          organization_id: currentOrganization.id,
          new_to_cold_minutes: 1440,
          hot_to_cold_days: 3,
          hot_to_cold_hours: 0,
          enable_auto_temperature: true,
          awaiting_response_minutes: 60,
          enable_auto_substatus: true,
          em_conversa_timeout_minutes: 60,
          enable_substatus_timeout: true,
          aguardando_to_cold_hours: 48,
          max_follow_up_attempts: 5,
          default_follow_up_interval: 3,
          enable_automation: false,
          automation_mode: 'manual' as const,
          use_ai_for_unmatched: false,
          enable_follow_up_alerts: true,
          enable_cold_lead_alerts: true,
          enable_no_show_alerts: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as CRMSettings;
      }

      return data as CRMSettings;
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useUpdateCRMSettings() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: UpdateCRMSettingsInput) => {
      if (!currentOrganization?.id) {
        throw new Error("Organização não selecionada");
      }

      // Verificar se já existe
      const { data: existing } = await supabase
        .from("crm_settings")
        .select("id")
        .eq("organization_id", currentOrganization.id)
        .maybeSingle();

      if (existing) {
        // Atualizar existente
        const { data, error } = await supabase
          .from("crm_settings")
          .update(input)
          .eq("organization_id", currentOrganization.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from("crm_settings")
          .insert({
            organization_id: currentOrganization.id,
            ...input,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating CRM settings:", error);
      toast.error("Erro ao salvar configurações");
    },
  });
}
