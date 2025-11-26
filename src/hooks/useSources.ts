import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
  return useQuery({
    queryKey: ["sources", includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("sources")
        .select("*")
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

  return useMutation({
    mutationFn: async (input: CreateSourceInput) => {
      const { data, error } = await supabase
        .from("sources")
        .insert([input])
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
