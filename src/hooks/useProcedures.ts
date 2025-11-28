import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface Procedure {
  id: string;
  name: string;
  category: string;
  default_price: number | null;
  description: string | null;
  active: boolean;
  created_at: string;
}

export interface CreateProcedureInput {
  name: string;
  category: string;
  default_price?: number;
  description?: string;
}

export interface UpdateProcedureInput {
  id: string;
  name?: string;
  category?: string;
  default_price?: number;
  description?: string;
  active?: boolean;
}

export function useProcedures(includeInactive = false) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ["procedures", currentOrganization?.id, includeInactive],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from("procedures")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("name");

      if (!includeInactive) {
        query = query.eq("active", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as Procedure[];
    },
  });
}

export function useCreateProcedure() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateProcedureInput) => {
      if (!currentOrganization?.id) throw new Error("No organization selected");
      
      const { data, error } = await supabase
        .from("procedures")
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
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast.success("Procedimento criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar procedimento");
    },
  });
}

export function useUpdateProcedure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProcedureInput) => {
      const { data, error } = await supabase
        .from("procedures")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast.success("Procedimento atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar procedimento");
    },
  });
}

export function useDeleteProcedure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("procedures")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast.success("Procedimento excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir procedimento");
    },
  });
}
