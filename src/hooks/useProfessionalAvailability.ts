import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProfessionalAvailability {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number | null;
  break_start: string | null;
  break_end: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProfessionalAvailabilityInsert {
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes?: number | null;
  break_start?: string | null;
  break_end?: string | null;
  is_active?: boolean;
}

export interface ProfessionalAvailabilityUpdate {
  id?: string;
  weekday?: number;
  start_time?: string;
  end_time?: string;
  slot_minutes?: number | null;
  break_start?: string | null;
  break_end?: string | null;
  is_active?: boolean;
}

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
      return (data as any[]) as ProfessionalAvailability[];
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
    onError: (error: Error) => {
      toast.error("Erro ao adicionar disponibilidade: " + error.message);
    },
  });
}

export function useUpdateProfessionalAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, professional_id, ...input }: ProfessionalAvailabilityUpdate & { id: string; professional_id?: string }) => {
      const { data, error } = await supabase
        .from("professional_availability" as any)
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      const result = data as any;
      return { ...result, professional_id: professional_id ?? result.professional_id } as ProfessionalAvailability;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["professional-availability", data.professional_id],
      });
      toast.success("Disponibilidade atualizada.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar disponibilidade: " + error.message);
    },
  });
}

export function useDeleteProfessionalAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, professional_id }: { id: string; professional_id: string }) => {
      const { error } = await supabase
        .from("professional_availability" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, professional_id };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["professional-availability", variables.professional_id],
      });
      toast.success("Disponibilidade removida.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover disponibilidade: " + error.message);
    },
  });
}
