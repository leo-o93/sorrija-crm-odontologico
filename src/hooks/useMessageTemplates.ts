import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export type TemplateCategory = 'welcome' | 'follow_up' | 'reminder' | 'no_show' | 'reactivation' | 'quote';

export interface MessageTemplate {
  id: string;
  organization_id: string;
  name: string;
  category: TemplateCategory;
  interest_id: string | null;
  temperature: string | null;
  attempt_number: number | null;
  content: string;
  active: boolean;
  created_at: string;
}

export interface CreateMessageTemplateInput {
  name: string;
  category: TemplateCategory;
  interest_id?: string | null;
  temperature?: string | null;
  attempt_number?: number | null;
  content: string;
}

export interface UpdateMessageTemplateInput extends Partial<CreateMessageTemplateInput> {
  id: string;
  active?: boolean;
}

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'welcome', label: 'Boas-vindas' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'reminder', label: 'Lembrete' },
  { value: 'no_show', label: 'Faltou' },
  { value: 'reactivation', label: 'Reativação' },
  { value: 'quote', label: 'Orçamento' },
];

export const TEMPLATE_VARIABLES = [
  { variable: '{{nome}}', description: 'Nome do lead/paciente' },
  { variable: '{{procedimento}}', description: 'Procedimento de interesse' },
  { variable: '{{data_agendamento}}', description: 'Data do agendamento' },
  { variable: '{{hora_agendamento}}', description: 'Hora do agendamento' },
  { variable: '{{clinica}}', description: 'Nome da clínica' },
  { variable: '{{valor}}', description: 'Valor do orçamento' },
];

export function useMessageTemplates(category?: TemplateCategory, includeInactive = false) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ["message_templates", currentOrganization?.id, category, includeInactive],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from("message_templates")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      if (!includeInactive) {
        query = query.eq("active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MessageTemplate[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateMessageTemplate() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateMessageTemplateInput) => {
      if (!currentOrganization?.id) {
        throw new Error("Organização não selecionada");
      }

      const { data, error } = await supabase
        .from("message_templates")
        .insert({
          organization_id: currentOrganization.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message_templates"] });
      toast.success("Template criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating message template:", error);
      toast.error("Erro ao criar template");
    },
  });
}

export function useUpdateMessageTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMessageTemplateInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("message_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message_templates"] });
      toast.success("Template atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating message template:", error);
      toast.error("Erro ao atualizar template");
    },
  });
}

export function useDeleteMessageTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from("message_templates")
        .update({ active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message_templates"] });
      toast.success("Template excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting message template:", error);
      toast.error("Erro ao excluir template");
    },
  });
}

// Função para substituir variáveis no template
export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}
