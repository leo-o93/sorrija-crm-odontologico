import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProfessionalTimeOff =
  Database["public"]["Tables"]["professional_time_off"]["Row"];
export type ProfessionalTimeOffInsert =
  Database["public"]["Tables"]["professional_time_off"]["Insert"];
export type ProfessionalTimeOffUpdate =
  Database["public"]["Tables"]["professional_time_off"]["Update"];

export function useProfessionalTimeOff(professionalId?: string) {
  return useQuery({
    queryKey: ["professional-time-off", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const { data, error } = await supabase
        .from("professional_time_off")
        .select("*")
        .eq("professional_id", professionalId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as ProfessionalTimeOff[];
    },
    enabled: !!professionalId,
  });
}

export function useCreateProfessionalTimeOff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProfessionalTimeOffInsert) => {
      const { data, error } = await supabase
        .from("professional_time_off")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as ProfessionalTimeOff;
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
        .from("professional_time_off")
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
