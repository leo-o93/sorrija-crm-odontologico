import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

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
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ["leadStats", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0];

      // Total leads do mês
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrganization.id)
        .gte("registration_date", firstDayOfMonth);

      // Agendamentos para hoje
      const { count: scheduledToday } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrganization.id)
        .eq("appointment_date", today)
        .eq("status", "agendado");

      // Receita do mês (leads com orçamento fechado)
      const { data: revenueData } = await supabase
        .from("leads")
        .select("budget_total")
        .eq("organization_id", currentOrganization.id)
        .gte("registration_date", firstDayOfMonth)
        .eq("status", "fechado")
        .limit(5000);

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
        .eq("organization_id", currentOrganization.id)
        .eq("evaluation_result", "Fechou")
        .gte("registration_date", firstDayOfMonth);

      // Faltas
      const { count: noShow } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrganization.id)
        .eq("status", "nao_compareceu")
        .gte("registration_date", firstDayOfMonth);

      // Em tratamento (compareceu + avaliação + orçamento enviado + pós-consulta)
      const { count: inTreatment } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrganization.id)
        .in("status", ["compareceu", "avaliacao", "orcamento_enviado", "pos_consulta"]);

      // Finalizados (fechado)
      const { count: completed } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrganization.id)
        .eq("status", "fechado");

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
    enabled: !!currentOrganization?.id,
  });
}
