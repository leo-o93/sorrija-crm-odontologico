import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, eachMonthOfInterval } from 'date-fns';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface SalesDashboardData {
  // Temperature breakdown
  leadsByTemperature: {
    novo: number;
    quente: number;
    frio: number;
    perdido: number;
  };
  
  // Hot substatus breakdown
  hotSubstatus: {
    em_conversa: number;
    aguardando_resposta: number;
    em_negociacao: number;
    follow_up_agendado: number;
  };
  
  // Scheduling status
  scheduledLeads: number;
  unscheduledLeads: number;
  schedulingRate: number;
  
  // Conversion funnel
  totalLeads: number;
  leadsContacted: number;
  leadsScheduled: number;
  leadsAttended: number;
  leadsClosed: number;
  
  // Financial
  monthlyRevenue: number;
  averageTicket: number;
  
  // Growth
  leadsGrowth: number;
  revenueGrowth: number;
  
  // By interest
  leadsByInterest: Array<{ name: string; value: number; percentage: number }>;
  
  // By source
  leadsBySource: Array<{ name: string; value: number; percentage: number }>;
  
  // Monthly evolution
  monthlyEvolution: Array<{ month: string; leads: number; revenue: number; scheduled: number }>;
}

export function useSalesDashboard(startDate?: Date, endDate?: Date) {
  const { currentOrganization } = useOrganization();
  const start = startDate || startOfMonth(new Date());
  const end = endDate || endOfMonth(new Date());
  
  const previousStart = subMonths(start, 1);
  const previousEnd = subMonths(end, 1);

  return useQuery({
    queryKey: ['salesDashboard', currentOrganization?.id, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
    queryFn: async (): Promise<SalesDashboardData> => {
      if (!currentOrganization?.id) throw new Error('No organization');

      // Fetch current period leads with relations
      const { data: currentLeads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id, status, scheduled, temperature, hot_substatus,
          evaluation_result, budget_total,
          source_id, sources(name),
          interest_id, procedures:interest_id(name)
        `)
        .eq('organization_id', currentOrganization.id)
        .gte('registration_date', format(start, 'yyyy-MM-dd'))
        .lte('registration_date', format(end, 'yyyy-MM-dd'));

      if (leadsError) throw leadsError;

      // Fetch previous period leads count
      const { count: previousLeadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .gte('registration_date', format(previousStart, 'yyyy-MM-dd'))
        .lte('registration_date', format(previousEnd, 'yyyy-MM-dd'));

      // Fetch current period revenue
      const { data: currentTransactions } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('organization_id', currentOrganization.id)
        .eq('type', 'receita')
        .eq('status', 'paid')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'));

      // Fetch previous period revenue
      const { data: previousTransactions } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('organization_id', currentOrganization.id)
        .eq('type', 'receita')
        .eq('status', 'paid')
        .gte('transaction_date', format(previousStart, 'yyyy-MM-dd'))
        .lte('transaction_date', format(previousEnd, 'yyyy-MM-dd'));

      // Fetch last 6 months for evolution
      const sixMonthsAgo = subMonths(start, 5);
      const { data: evolutionLeads } = await supabase
        .from('leads')
        .select('registration_date, budget_total, status, scheduled')
        .eq('organization_id', currentOrganization.id)
        .gte('registration_date', format(sixMonthsAgo, 'yyyy-MM-dd'))
        .lte('registration_date', format(end, 'yyyy-MM-dd'));

      const leads = currentLeads || [];
      const totalLeads = leads.length;

      // Temperature breakdown
      const leadsByTemperature = {
        novo: leads.filter(l => l.temperature === 'novo' || !l.temperature).length,
        quente: leads.filter(l => l.temperature === 'quente').length,
        frio: leads.filter(l => l.temperature === 'frio').length,
        perdido: leads.filter(l => l.temperature === 'perdido').length,
      };

      // Hot substatus breakdown (only for hot leads)
      const hotLeads = leads.filter(l => l.temperature === 'quente');
      const hotSubstatus = {
        em_conversa: hotLeads.filter(l => l.hot_substatus === 'em_conversa' || !l.hot_substatus).length,
        aguardando_resposta: hotLeads.filter(l => l.hot_substatus === 'aguardando_resposta').length,
        em_negociacao: hotLeads.filter(l => l.hot_substatus === 'em_negociacao').length,
        follow_up_agendado: hotLeads.filter(l => l.hot_substatus === 'follow_up_agendado').length,
      };

      // Scheduling status
      const scheduledLeads = leads.filter(l => l.scheduled).length;
      const unscheduledLeads = totalLeads - scheduledLeads;
      const schedulingRate = totalLeads > 0 ? (scheduledLeads / totalLeads) * 100 : 0;

      // Conversion funnel
      const leadsContacted = leads.filter(l => l.status !== 'novo_lead').length;
      const leadsScheduled = leads.filter(l => 
        l.scheduled || l.status === 'agendado' || l.status === 'compareceu' || l.status === 'fechado'
      ).length;
      const leadsAttended = leads.filter(l => 
        l.status === 'compareceu' || l.status === 'fechado' || l.evaluation_result === 'Fechou'
      ).length;
      const leadsClosed = leads.filter(l => 
        l.status === 'fechado' || l.evaluation_result === 'Fechou'
      ).length;

      // Financial
      const monthlyRevenue = currentTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const averageTicket = leadsClosed > 0 ? monthlyRevenue / leadsClosed : 0;

      // Growth calculations
      const previousTotalLeads = previousLeadsCount || 0;
      const previousRevenue = previousTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const leadsGrowth = previousTotalLeads > 0 
        ? ((totalLeads - previousTotalLeads) / previousTotalLeads) * 100 
        : 0;
      const revenueGrowth = previousRevenue > 0 
        ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      // Leads by interest (procedure)
      const interestMap = new Map<string, number>();
      leads.forEach(lead => {
        const interestName = (lead.procedures as any)?.name || 'Sem interesse';
        interestMap.set(interestName, (interestMap.get(interestName) || 0) + 1);
      });
      const leadsByInterest = Array.from(interestMap.entries())
        .map(([name, value]) => ({
          name,
          value,
          percentage: totalLeads > 0 ? (value / totalLeads) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // Leads by source
      const sourceMap = new Map<string, number>();
      leads.forEach(lead => {
        const sourceName = (lead.sources as any)?.name || 'Sem fonte';
        sourceMap.set(sourceName, (sourceMap.get(sourceName) || 0) + 1);
      });
      const leadsBySource = Array.from(sourceMap.entries())
        .map(([name, value]) => ({
          name,
          value,
          percentage: totalLeads > 0 ? (value / totalLeads) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // Monthly evolution
      const months = eachMonthOfInterval({ start: sixMonthsAgo, end });
      const monthlyEvolution = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const monthLeads = (evolutionLeads || []).filter(l => {
          const regDate = new Date(l.registration_date);
          return regDate >= monthStart && regDate <= monthEnd;
        });

        const monthRevenue = monthLeads
          .filter(l => l.status === 'fechado')
          .reduce((sum, l) => sum + (Number(l.budget_total) || 0), 0);

        const scheduled = monthLeads.filter(l => l.scheduled).length;

        return {
          month: format(month, 'MMM/yy'),
          leads: monthLeads.length,
          revenue: monthRevenue,
          scheduled
        };
      });

      return {
        leadsByTemperature,
        hotSubstatus,
        scheduledLeads,
        unscheduledLeads,
        schedulingRate,
        totalLeads,
        leadsContacted,
        leadsScheduled,
        leadsAttended,
        leadsClosed,
        monthlyRevenue,
        averageTicket,
        leadsGrowth,
        revenueGrowth,
        leadsByInterest,
        leadsBySource,
        monthlyEvolution,
      };
    },
    enabled: !!currentOrganization?.id,
  });
}
