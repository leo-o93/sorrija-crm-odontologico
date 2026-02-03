import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define types locally since the table may not be in generated types yet
export interface ProfessionalAvailability {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export type ProfessionalAvailabilityInsert = Omit<ProfessionalAvailability, "id" | "created_at">;
export type ProfessionalAvailabilityUpdate = Partial<ProfessionalAvailabilityInsert>;

export function useProfessionalAvailability(professionalId?: string) {
  return useQuery({
    queryKey: ["professional-availability", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const { data, error } = await supabase
        .from("professional_availability" as any)
        .select("*")
        .eq("professional_id", professionalId)
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as ProfessionalAvailability[];
    },
    enabled: !!professionalId,
  });
}

export function useCreateProfessionalAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProfessionalAvailabilityInsert) => {
      const { data, error } = await supabase
        .from("professional_availability" as any)
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ProfessionalAvailability;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["professional-availability", variables.professional_id],
      });
      toast.success("Disponibilidade adicionada.");
    },
    onError: (error) => {
      console.error("Error creating availability:", error);
      toast.error("Erro ao adicionar disponibilidade");
    },
  });
}

export function useUpdateProfessionalAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProfessionalAvailabilityUpdate & { id: string }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("professional_availability" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ProfessionalAvailability;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["professional-availability", data.professional_id],
      });
      toast.success("Disponibilidade atualizada.");
    },
    onError: (error) => {
      console.error("Error updating availability:", error);
      toast.error("Erro ao atualizar disponibilidade");
    },
  });
}

export function useDeleteProfessionalAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; professionalId: string }) => {
      const { error } = await supabase
        .from("professional_availability" as any)
        .delete()
        .eq("id", input.id);

      if (error) throw error;
      return input;
    },
    onSuccess: (input) => {
      queryClient.invalidateQueries({
        queryKey: ["professional-availability", input.professionalId],
      });
      toast.success("Disponibilidade removida.");
    },
    onError: (error) => {
      console.error("Error deleting availability:", error);
      toast.error("Erro ao remover disponibilidade");
    },
  });
}
