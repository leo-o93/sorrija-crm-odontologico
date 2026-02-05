import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfessionalTimeOff {
  id: string;
  professional_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export interface ProfessionalTimeOffInsert {
  professional_id: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
}

export interface ProfessionalTimeOffUpdate {
  date?: string;
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
}

export function useProfessionalTimeOff(professionalId?: string) {
  return useQuery({
    queryKey: ["professional-time-off", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const { data, error } = await supabase
        .from("professional_time_off" as any)
        .select("*")
        .eq("professional_id", professionalId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data as any[]) as ProfessionalTimeOff[];
    },
    enabled: !!professionalId,
  });
}

export function useCreateProfessionalTimeOff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProfessionalTimeOffInsert) => {
      const { data, error } = await supabase
        .from("professional_time_off" as any)
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ProfessionalTimeOff;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["professional-time-off", data.professional_id],
      });
    },
  });
}

export function useDeleteProfessionalTimeOff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; professionalId: string }) => {
      const { error } = await supabase
        .from("professional_time_off" as any)
        .delete()
        .eq("id", input.id);
      if (error) throw error;
      return input;
    },
    onSuccess: (input) => {
      queryClient.invalidateQueries({
        queryKey: ["professional-time-off", input.professionalId],
      });
    },
  });
}
