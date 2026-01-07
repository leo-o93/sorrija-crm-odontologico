import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export type ConditionField = 'first_message' | 'any_message' | 'push_name' | 'source_name';
export type ConditionOperator = 'contains' | 'not_contains' | 'equals' | 'not_equals' | 'starts_with' | 'ends_with' | 'regex' | 'is_empty' | 'is_not_empty';

export interface InterestTrigger {
  id: string;
  organization_id: string;
  name: string;
  priority: number;
  condition_field: ConditionField;
  condition_operator: ConditionOperator;
  condition_value: string;
  case_sensitive: boolean;
  action_set_interest_id: string | null;
  action_set_source_id: string | null;
  action_set_temperature: string | null;
  action_set_status: string | null;
  active: boolean;
  created_at: string;
}

export interface CreateInterestTriggerInput {
  name: string;
  priority?: number;
  condition_field: ConditionField;
  condition_operator: ConditionOperator;
  condition_value: string;
  case_sensitive?: boolean;
  action_set_interest_id?: string | null;
  action_set_source_id?: string | null;
  action_set_temperature?: string | null;
  action_set_status?: string | null;
}

export interface UpdateInterestTriggerInput extends Partial<CreateInterestTriggerInput> {
  id: string;
  active?: boolean;
}

export function useInterestTriggers(includeInactive = false) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ["interest_triggers", currentOrganization?.id, includeInactive],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from("interest_triggers")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("priority", { ascending: true });

      if (!includeInactive) {
        query = query.eq("active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as InterestTrigger[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateInterestTrigger() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateInterestTriggerInput) => {
      if (!currentOrganization?.id) {
        throw new Error("Organização não selecionada");
      }

      // Get max priority if not provided
      let priority = input.priority;
      if (priority === undefined) {
        const { data: existingTriggers } = await supabase
          .from("interest_triggers")
          .select("priority")
          .eq("organization_id", currentOrganization.id)
          .eq("active", true)
          .order("priority", { ascending: false })
          .limit(1);

        priority = existingTriggers && existingTriggers.length > 0 
          ? existingTriggers[0].priority + 1 
          : 0;
      }

      const { data, error } = await supabase
        .from("interest_triggers")
        .insert({
          organization_id: currentOrganization.id,
          ...input,
          priority,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interest_triggers"] });
      toast.success("Gatilho criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating interest trigger:", error);
      toast.error("Erro ao criar gatilho");
    },
  });
}

export function useUpdateInterestTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateInterestTriggerInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("interest_triggers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interest_triggers"] });
      toast.success("Gatilho atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating interest trigger:", error);
      toast.error("Erro ao atualizar gatilho");
    },
  });
}

export function useDeleteInterestTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from("interest_triggers")
        .update({ active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interest_triggers"] });
      toast.success("Gatilho excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting interest trigger:", error);
      toast.error("Erro ao excluir gatilho");
    },
  });
}

export function useReorderInterestTriggers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (triggers: { id: string; priority: number }[]) => {
      const updates = triggers.map(({ id, priority }) =>
        supabase
          .from("interest_triggers")
          .update({ priority })
          .eq("id", id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        throw new Error("Erro ao reordenar gatilhos");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interest_triggers"] });
      toast.success("Ordem atualizada!");
    },
    onError: (error) => {
      console.error("Error reordering interest triggers:", error);
      toast.error("Erro ao reordenar gatilhos");
    },
  });
}

// Função auxiliar para testar um gatilho contra uma mensagem
export function testTriggerCondition(
  trigger: InterestTrigger,
  testValue: string
): boolean {
  const value = trigger.case_sensitive ? testValue : testValue.toLowerCase();
  const conditionValue = trigger.case_sensitive 
    ? trigger.condition_value 
    : trigger.condition_value.toLowerCase();

  switch (trigger.condition_operator) {
    case 'contains':
      return value.includes(conditionValue);
    case 'not_contains':
      return !value.includes(conditionValue);
    case 'equals':
      return value === conditionValue;
    case 'not_equals':
      return value !== conditionValue;
    case 'starts_with':
      return value.startsWith(conditionValue);
    case 'ends_with':
      return value.endsWith(conditionValue);
    case 'regex':
      try {
        const regex = new RegExp(trigger.condition_value, trigger.case_sensitive ? '' : 'i');
        return regex.test(testValue);
      } catch {
        return false;
      }
    case 'is_empty':
      return value.trim() === '';
    case 'is_not_empty':
      return value.trim() !== '';
    default:
      return false;
  }
}
