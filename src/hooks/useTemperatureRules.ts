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
  trigger_event: 'inactivity_timer' | 'substatus_timeout' | 'no_response' | 'message_received';
  from_temperature: string | null;
  from_substatus: string | null;
  timer_minutes: number;
  action_set_temperature: string | null;
  action_clear_substatus: boolean;
  action_set_substatus: string | null;
  condition_message_direction: 'in' | 'out' | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRuleInput {
  name: string;
  priority?: number;
  trigger_event: 'inactivity_timer' | 'substatus_timeout' | 'no_response' | 'message_received';
  from_temperature?: string | null;
  from_substatus?: string | null;
  timer_minutes?: number;
  action_set_temperature?: string | null;
  action_clear_substatus?: boolean;
  action_set_substatus?: string | null;
  condition_message_direction?: 'in' | 'out' | null;
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
          name: input.name,
          trigger_event: input.trigger_event,
          from_temperature: input.from_temperature,
          from_substatus: input.from_substatus,
          timer_minutes: input.timer_minutes ?? 0,
          action_set_temperature: input.action_set_temperature,
          action_clear_substatus: input.action_clear_substatus,
          action_set_substatus: input.action_set_substatus,
          condition_message_direction: input.condition_message_direction,
          organization_id: currentOrganization.id,
          priority: input.priority ?? maxPriority + 1,
        } as any)
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

// Função para testar se uma regra aplicaria a um lead simulado
export interface TestLeadConditions {
  temperature: string;
  substatus: string | null;
  minutesSinceInteraction: number;
  messageDirection?: 'in' | 'out' | null;
}

export interface TestResult {
  matches: boolean;
  reasons: Array<{
    condition: string;
    passed: boolean;
    expected: string;
    actual: string;
  }>;
}

export function testTransitionRule(
  rule: TemperatureTransitionRule,
  conditions: TestLeadConditions
): TestResult {
  const reasons: TestResult['reasons'] = [];
  let allPassed = true;
  
  const isMessageReceived = rule.trigger_event === 'message_received';

  // Verificar temperatura de origem
  if (rule.from_temperature) {
    const passed = conditions.temperature === rule.from_temperature;
    if (!passed) allPassed = false;
    reasons.push({
      condition: 'Temperatura',
      passed,
      expected: rule.from_temperature.toUpperCase(),
      actual: conditions.temperature.toUpperCase(),
    });
  } else {
    reasons.push({
      condition: 'Temperatura',
      passed: true,
      expected: 'Qualquer',
      actual: conditions.temperature.toUpperCase(),
    });
  }

  // Verificar substatus de origem
  if (rule.from_substatus) {
    const passed = conditions.substatus === rule.from_substatus;
    if (!passed) allPassed = false;
    reasons.push({
      condition: 'Substatus',
      passed,
      expected: rule.from_substatus === 'em_conversa' ? 'Em Conversa' : 'Aguardando Resposta',
      actual: conditions.substatus 
        ? (conditions.substatus === 'em_conversa' ? 'Em Conversa' : 'Aguardando Resposta')
        : 'Nenhum',
    });
  } else {
    reasons.push({
      condition: 'Substatus',
      passed: true,
      expected: 'Qualquer',
      actual: conditions.substatus 
        ? (conditions.substatus === 'em_conversa' ? 'Em Conversa' : 'Aguardando Resposta')
        : 'Nenhum',
    });
  }

  // Para message_received, verificar direção da mensagem ao invés de timer
  if (isMessageReceived) {
    if (rule.condition_message_direction) {
      const passed = conditions.messageDirection === rule.condition_message_direction;
      if (!passed) allPassed = false;
      reasons.push({
        condition: 'Direção',
        passed,
        expected: rule.condition_message_direction === 'in' ? 'Entrada' : 'Saída',
        actual: conditions.messageDirection 
          ? (conditions.messageDirection === 'in' ? 'Entrada' : 'Saída')
          : 'Não definida',
      });
    } else {
      reasons.push({
        condition: 'Direção',
        passed: true,
        expected: 'Qualquer',
        actual: conditions.messageDirection 
          ? (conditions.messageDirection === 'in' ? 'Entrada' : 'Saída')
          : 'Não definida',
      });
    }
  } else {
    // Verificar timer para outros eventos
    const timerPassed = conditions.minutesSinceInteraction >= rule.timer_minutes;
    if (!timerPassed) allPassed = false;
    reasons.push({
      condition: 'Timer',
      passed: timerPassed,
      expected: `≥ ${rule.timer_minutes} minutos`,
      actual: `${conditions.minutesSinceInteraction} minutos`,
    });
  }

  return { matches: allPassed, reasons };
}
