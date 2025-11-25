import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subMonths } from "date-fns";

export interface Alert {
  id: string;
  type: "warning" | "info" | "error";
  icon: string;
  title: string;
  description: string;
  time: string;
  count: number;
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const sixMonthsAgo = subMonths(today, 6);

      // Get today's no-shows
      const { data: noShows, error: noShowError } = await supabase
        .from("appointments")
        .select("id")
        .eq("status", "no_show")
        .gte("appointment_date", todayStart.toISOString())
        .lte("appointment_date", todayEnd.toISOString());

      if (noShowError) throw noShowError;

      // Get today's birthdays
      const { data: patients, error: patientsError } = await supabase
        .from("patients")
        .select("id, birth_date")
        .eq("active", true);

      if (patientsError) throw patientsError;

      const birthdays = patients?.filter((patient) => {
        if (!patient.birth_date) return false;
        const birthDate = new Date(patient.birth_date);
        return (
          birthDate.getDate() === today.getDate() &&
          birthDate.getMonth() === today.getMonth()
        );
      }) || [];

      // Get patients with pending returns (no appointment in last 6 months with attended status)
      const { data: recentAppointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("patient_id, appointment_date, status")
        .eq("status", "attended")
        .gte("appointment_date", sixMonthsAgo.toISOString());

      if (appointmentsError) throw appointmentsError;

      const { data: allPatients, error: allPatientsError } = await supabase
        .from("patients")
        .select("id")
        .eq("active", true);

      if (allPatientsError) throw allPatientsError;

      const recentPatientIds = new Set(
        recentAppointments?.map((apt) => apt.patient_id) || []
      );
      const pendingReturns = allPatients?.filter(
        (patient) => !recentPatientIds.has(patient.id)
      ) || [];

      const alerts: Alert[] = [];

      if (noShows && noShows.length > 0) {
        alerts.push({
          id: "no-shows",
          type: "warning",
          icon: "Calendar",
          title: `${noShows.length} ${noShows.length === 1 ? "paciente faltou" : "pacientes faltaram"} hoje`,
          description: "Agendar follow-up",
          time: "Hoje",
          count: noShows.length,
        });
      }

      if (birthdays.length > 0) {
        alerts.push({
          id: "birthdays",
          type: "info",
          icon: "Users",
          title: `${birthdays.length} ${birthdays.length === 1 ? "aniversariante" : "aniversariantes"} hoje`,
          description: "Enviar mensagem",
          time: "Hoje",
          count: birthdays.length,
        });
      }

      if (pendingReturns.length > 0) {
        alerts.push({
          id: "pending-returns",
          type: "error",
          icon: "Clock",
          title: `${pendingReturns.length} ${pendingReturns.length === 1 ? "retorno pendente" : "retornos pendentes"}`,
          description: "Pacientes sem retorno há 6+ meses",
          time: "Esta semana",
          count: pendingReturns.length,
        });
      }

      return alerts;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
