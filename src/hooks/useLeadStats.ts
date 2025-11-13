import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface LeadStats {
  totalLeads: number;
  scheduledToday: number;
  monthlyRevenue: number;
  averageTicket: number;
  attended: number;
  noShow: number;
  inTreatment: number;
  completed: number;
}

export function useLeadStats() {
  return useQuery({
    queryKey: ["leadStats"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0];

      // Total leads do mês
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("registration_date", firstDayOfMonth);

      // Agendamentos para hoje
      const { count: scheduledToday } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("appointment_date", today)
        .eq("status", "agendado");

      // Receita do mês (leads com orçamento fechado)
      const { data: revenueData } = await supabase
        .from("leads")
        .select("budget_total")
        .gte("registration_date", firstDayOfMonth)
        .in("status", ["fechado", "pos_venda", "em_tratamento"]);

      const monthlyRevenue = revenueData?.reduce(
        (sum, lead) => sum + (lead.budget_total || 0),
        0
      ) || 0;

      // Ticket médio
      const closedLeadsCount = revenueData?.length || 0;
      const averageTicket = closedLeadsCount > 0 ? monthlyRevenue / closedLeadsCount : 0;

      // Comparecimentos
      const { count: attended } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("evaluation_result", "Fechou")
        .gte("registration_date", firstDayOfMonth);

      // Faltas
      const { count: noShow } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("evaluation_result", "Faltou")
        .gte("registration_date", firstDayOfMonth);

      // Em tratamento
      const { count: inTreatment } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "em_tratamento");

      // Finalizados
      const { count: completed } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "pos_venda");

      return {
        totalLeads: totalLeads || 0,
        scheduledToday: scheduledToday || 0,
        monthlyRevenue,
        averageTicket,
        attended: attended || 0,
        noShow: noShow || 0,
        inTreatment: inTreatment || 0,
        completed: completed || 0,
      } as LeadStats;
    },
  });
}
