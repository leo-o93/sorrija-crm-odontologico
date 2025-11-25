import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  notes: string | null;
  patient_id: string | null;
  lead_id: string | null;
  procedure_id: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    name: string;
    phone: string;
  };
  lead?: {
    id: string;
    name: string;
    phone: string;
  };
  procedure?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface CreateAppointmentInput {
  appointment_date: string;
  status?: string;
  notes?: string;
  patient_id?: string;
  lead_id?: string;
  procedure_id?: string;
}

export interface UpdateAppointmentInput extends Partial<CreateAppointmentInput> {
  id: string;
}

export function useAppointments(filters?: { 
  startDate?: string; 
  endDate?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["appointments", filters],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          patient:patients(id, name, phone),
          lead:leads(id, name, phone),
          procedure:procedures(id, name, category)
        `)
        .order("appointment_date", { ascending: true });

      if (filters?.startDate) {
        query = query.gte("appointment_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("appointment_date", filters.endDate);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Appointment[];
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          ...input,
          status: input.status || "scheduled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar agendamento: " + error.message);
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateAppointmentInput) => {
      const { data, error } = await supabase
        .from("appointments")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar agendamento: " + error.message);
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir agendamento: " + error.message);
    },
  });
}
