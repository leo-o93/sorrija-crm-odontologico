import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateTemperatureInput {
  id: string;
  temperature: string;
  hot_substatus?: string | null;
  lost_reason?: string | null;
}

export function useUpdateLeadTemperature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, temperature, hot_substatus, lost_reason }: UpdateTemperatureInput) => {
      const updateData: Record<string, unknown> = {
        temperature,
        updated_at: new Date().toISOString(),
      };

      // Reset substatus if not quente
      if (temperature !== "quente") {
        updateData.hot_substatus = null;
      } else if (hot_substatus) {
        updateData.hot_substatus = hot_substatus;
      }

      // Set lost reason if perdido
      if (temperature === "perdido" && lost_reason) {
        updateData.lost_reason = lost_reason;
      } else if (temperature !== "perdido") {
        updateData.lost_reason = null;
      }

      // Update last_interaction_at when reactivating
      if (temperature === "quente") {
        updateData.last_interaction_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      queryClient.invalidateQueries({ queryKey: ["salesDashboard"] });
      toast.success("Temperatura atualizada");
    },
    onError: () => {
      toast.error("Erro ao atualizar temperatura");
    },
  });
}

export function useUpdateLeadSubstatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, hot_substatus }: { id: string; hot_substatus: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ 
          hot_substatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Substatus atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar substatus");
    },
  });
}
