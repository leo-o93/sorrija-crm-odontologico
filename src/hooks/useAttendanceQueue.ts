import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface AttendanceQueueEntry {
  id: string;
  organization_id: string;
  appointment_id: string | null;
  patient_id: string | null;
  lead_id: string | null;
  status: "waiting" | "in_progress" | "completed";
  checked_in_at: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  appointment?: {
    id: string;
    appointment_date: string;
    status: string;
    patient?: {
      id: string;
      name: string;
      phone: string;
    } | null;
    lead?: {
      id: string;
      name: string;
      phone: string;
    } | null;
    procedure?: {
      id: string;
      name: string;
      category: string;
    } | null;
    professional?: {
      id: string;
      name: string;
    } | null;
  } | null;
  patient?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  lead?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

interface AttendanceQueueFilters {
  startDate?: string;
  endDate?: string;
}

export interface CreateAttendanceQueueInput {
  appointment_id?: string | null;
  patient_id?: string | null;
  lead_id?: string | null;
}

export interface UpdateAttendanceQueueInput {
  id: string;
  status?: AttendanceQueueEntry["status"];
  started_at?: string | null;
  finished_at?: string | null;
}

export function useAttendanceQueue(filters?: AttendanceQueueFilters) {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["attendance_queue", currentOrganization?.id, filters],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let queueQuery = supabase
        .from("attendance_queue")
        .select(
          `
          *,
          appointment:appointments(
            id,
            appointment_date,
            status,
            patient:patients(id, name, phone),
            lead:leads(id, name, phone),
            procedure:procedures(id, name, category),
            professional:professionals(id, name)
          ),
          patient:patients(id, name, phone),
          lead:leads(id, name, phone)
        `
        )
        .eq("organization_id", currentOrganization.id)
        .order("checked_in_at", { ascending: true });

      if (filters?.startDate) {
        queueQuery = queueQuery.gte("checked_in_at", filters.startDate);
      }
      if (filters?.endDate) {
        queueQuery = queueQuery.lte("checked_in_at", filters.endDate);
      }

      const { data, error } = await queueQuery;
      if (error) throw error;
      return (data as any[]) as AttendanceQueueEntry[];
    },
  });

  useEffect(() => {
    if (!currentOrganization?.id) return undefined;

    const channel = supabase
      .channel("attendance-queue-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_queue",
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["attendance_queue", currentOrganization?.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization?.id, queryClient]);

  return query;
}

export function useCreateAttendanceQueue() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateAttendanceQueueInput) => {
      if (!currentOrganization?.id) throw new Error("No organization selected");

      const { data, error } = await supabase
        .from("attendance_queue")
        .insert({
          organization_id: currentOrganization.id,
          appointment_id: input.appointment_id ?? null,
          patient_id: input.patient_id ?? null,
          lead_id: input.lead_id ?? null,
          status: "waiting",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance_queue"] });
      toast.success("Check-in realizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao realizar check-in: " + error.message);
    },
  });
}

export function useUpdateAttendanceQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateAttendanceQueueInput) => {
      const { data, error } = await supabase
        .from("attendance_queue")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance_queue"] });
      toast.success("Fila atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar fila: " + error.message);
    },
  });
}
