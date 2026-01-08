import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface TemperatureTransitionRule {
  id: string;
  organization_id: string;
  name: string;
  priority: number;
  active: boolean;
  trigger_event: 'inactivity_timer' | 'substatus_timeout' | 'no_response';
  from_temperature: string | null;
  from_substatus: string | null;
  timer_minutes: number;
  action_set_temperature: string | null;
  action_clear_substatus: boolean;
  action_set_substatus: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRuleInput {
  name: string;
  priority?: number;
  trigger_event: 'inactivity_timer' | 'substatus_timeout' | 'no_response';
  from_temperature?: string | null;
  from_substatus?: string | null;
  timer_minutes: number;
  action_set_temperature?: string | null;
  action_clear_substatus?: boolean;
  action_set_substatus?: string | null;
}

export interface UpdateRuleInput extends Partial<CreateRuleInput> {
  active?: boolean;
}

export function useTemperatureRules() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['temperature-rules', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('temperature_transition_rules')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return data as TemperatureTransitionRule[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateTemperatureRule() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRuleInput) => {
      if (!currentOrganization?.id) throw new Error('Organização não selecionada');

      // Get max priority
      const { data: existing } = await supabase
        .from('temperature_transition_rules')
        .select('priority')
        .eq('organization_id', currentOrganization.id)
        .order('priority', { ascending: false })
        .limit(1);

      const maxPriority = existing?.[0]?.priority ?? -1;

      const { data, error } = await supabase
        .from('temperature_transition_rules')
        .insert({
          ...input,
          organization_id: currentOrganization.id,
          priority: input.priority ?? maxPriority + 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temperature-rules'] });
      toast.success('Regra criada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar regra: ' + error.message);
    },
  });
}

export function useUpdateTemperatureRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateRuleInput & { id: string }) => {
      const { data, error } = await supabase
        .from('temperature_transition_rules')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temperature-rules'] });
      toast.success('Regra atualizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar regra: ' + error.message);
    },
  });
}

export function useDeleteTemperatureRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('temperature_transition_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temperature-rules'] });
      toast.success('Regra excluída com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir regra: ' + error.message);
    },
  });
}

export function useReorderTemperatureRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('temperature_transition_rules')
          .update({ priority: index })
          .eq('id', id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temperature-rules'] });
    },
    onError: (error) => {
      toast.error('Erro ao reordenar regras: ' + error.message);
    },
  });
}
