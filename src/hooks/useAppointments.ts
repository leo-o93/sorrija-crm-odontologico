import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";

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
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ["appointments", currentOrganization?.id, filters],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from("appointments")
        .select(`
          *,
          patient:patients(id, name, phone),
          lead:leads(id, name, phone),
          procedure:procedures(id, name, category)
        `)
        .eq("organization_id", currentOrganization.id)
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
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      if (!currentOrganization?.id) throw new Error("No organization selected");
      
      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          ...input,
          status: input.status || "scheduled",
          organization_id: currentOrganization.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Se tem lead_id, atualizar o lead para marcá-lo como agendado
      if (input.lead_id && input.status !== 'cancelled' && input.status !== 'completed') {
        const appointmentDate = input.appointment_date?.split('T')[0] || null;
        await supabase
          .from("leads")
          .update({
            scheduled: true,
            appointment_date: appointmentDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.lead_id);
      }

      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
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
        .select("*, lead_id")
        .single();

      if (error) throw error;

      // Se o status mudou para completed ou cancelled, verificar se deve atualizar lead
      if (data.lead_id && (input.status === 'completed' || input.status === 'cancelled')) {
        // Buscar próximo agendamento ativo para o lead
        const { data: nextAppointment } = await supabase
          .from("appointments")
          .select("appointment_date")
          .eq("lead_id", data.lead_id)
          .eq("status", "scheduled")
          .neq("id", id)
          .order("appointment_date", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (nextAppointment) {
          // Atualizar appointment_date do lead com o próximo agendamento
          await supabase
            .from("leads")
            .update({
              scheduled: true,
              appointment_date: nextAppointment.appointment_date?.split('T')[0],
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.lead_id);
        } else {
          // Sem mais agendamentos, desmarcar
          await supabase
            .from("leads")
            .update({
              scheduled: false,
              appointment_date: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.lead_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
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
      // 1. Buscar o agendamento para obter lead_id antes de deletar
      const { data: appointment } = await supabase
        .from("appointments")
        .select("lead_id")
        .eq("id", id)
        .single();

      // 2. Deletar o agendamento
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // 3. Se tinha lead, verificar se ainda tem outros agendamentos ativos
      if (appointment?.lead_id) {
        const { data: otherAppointments } = await supabase
          .from("appointments")
          .select("id, appointment_date")
          .eq("lead_id", appointment.lead_id)
          .eq("status", "scheduled")
          .order("appointment_date", { ascending: true })
          .limit(1);

        if (!otherAppointments || otherAppointments.length === 0) {
          // Não tem mais agendamentos, desmarcar o lead
          await supabase
            .from("leads")
            .update({
              scheduled: false,
              appointment_date: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", appointment.lead_id);
        } else {
          // Atualizar com a próxima data de agendamento
          await supabase
            .from("leads")
            .update({
              scheduled: true,
              appointment_date: otherAppointments[0].appointment_date?.split('T')[0],
              updated_at: new Date().toISOString(),
            })
            .eq("id", appointment.lead_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      toast.success("Agendamento excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir agendamento: " + error.message);
    },
  });
}
