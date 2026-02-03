import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

// Define types locally since the table may not be in generated types yet
export interface Professional {
  id: string;
  organization_id: string;
  name: string;
  role: string;
  specialty?: string | null;
  crm?: string | null;
  email?: string | null;
  phone?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProfessionalInsert = Partial<Omit<Professional, "id" | "created_at" | "updated_at">> & {
  organization_id: string;
  name: string;
  active: boolean;
};
export type ProfessionalUpdate = Partial<Omit<Professional, "id" | "created_at" | "updated_at">>;

export function useProfessionals(includeInactive = false) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ["professionals", currentOrganization?.id, includeInactive],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      let query = supabase
        .from("professionals" as any)
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("name", { ascending: true });

      if (!includeInactive) {
        query = query.eq("active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Professional[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: Omit<ProfessionalInsert, "organization_id">) => {
      if (!currentOrganization?.id) {
        throw new Error("Organização não selecionada");
      }

      const { data, error } = await supabase
        .from("professionals" as any)
        .insert({
          organization_id: currentOrganization.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Professional;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional cadastrado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating professional:", error);
      toast.error("Erro ao cadastrar profissional");
    },
  });
}

export function useUpdateProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProfessionalUpdate & { id: string }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("professionals" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Professional;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating professional:", error);
      toast.error("Erro ao atualizar profissional");
    },
  });
}

export function useDeactivateProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("professionals" as any)
        .update({ active: false })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Professional;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional desativado.");
    },
    onError: (error) => {
      console.error("Error deactivating professional:", error);
      toast.error("Erro ao desativar profissional");
    },
  });
}
