import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface Source {
  id: string;
  name: string;
  channel: string;
  active: boolean;
  created_at: string;
}

export interface CreateSourceInput {
  name: string;
  channel: string;
}

export interface UpdateSourceInput {
  id: string;
  name?: string;
  channel?: string;
  active?: boolean;
}

export function useSources(includeInactive = false) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ["sources", currentOrganization?.id, includeInactive],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from("sources")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("name");

      if (!includeInactive) {
        query = query.eq("active", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as Source[];
    },
  });
}

export function useCreateSource() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateSourceInput) => {
      if (!currentOrganization?.id) throw new Error("No organization selected");
      
      const { data, error } = await supabase
        .from("sources")
        .insert([{
          ...input,
          organization_id: currentOrganization.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      toast.success("Fonte criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar fonte");
    },
  });
}

export function useUpdateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSourceInput) => {
      const { data, error } = await supabase
        .from("sources")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      toast.success("Fonte atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar fonte");
    },
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sources")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      toast.success("Fonte excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir fonte");
    },
  });
}
