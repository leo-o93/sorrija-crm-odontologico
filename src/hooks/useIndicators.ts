import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, eachMonthOfInterval, subDays } from 'date-fns';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface IndicatorMetrics {
  // Current period
  totalLeads: number;
  leadsContacted: number;
  leadsScheduled: number;
  leadsAttended: number;
  leadsClosed: number;
  
  // Rates
  conversionRate: number;
  schedulingRate: number;
  attendanceRate: number;
  closingRate: number;
  
  // Financial
  monthlyRevenue: number;
  averageTicket: number;
  
  // Comparison with previous period
  previousTotalLeads: number;
  previousRevenue: number;
  leadsGrowth: number;
  revenueGrowth: number;
  
  // Sources
  leadsBySource: Array<{ name: string; value: number; percentage: number }>;
  
  // Monthly evolution (last 6 months)
  monthlyEvolution: Array<{ month: string; leads: number; revenue: number }>;
}

export function useIndicators(startDate?: Date, endDate?: Date) {
  const { currentOrganization } = useOrganization();
  const start = startDate || startOfMonth(new Date());
  const end = endDate || endOfMonth(new Date());
  
  const previousStart = subMonths(start, 1);
  const previousEnd = subMonths(end, 1);

  return useQuery({
    queryKey: ['indicators', currentOrganization?.id, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
    queryFn: async (): Promise<IndicatorMetrics> => {
      if (!currentOrganization?.id) return null as any;
      // Fetch current period leads
      const { data: currentLeads, error: leadsError } = await supabase
        .from('leads')
        .select('id, status, evaluation_result, budget_total, source_id, sources(name)')
        .eq('organization_id', currentOrganization.id)
        .gte('registration_date', format(start, 'yyyy-MM-dd'))
        .lte('registration_date', format(end, 'yyyy-MM-dd'));

      if (leadsError) throw leadsError;

      // Fetch previous period leads
      const { data: previousLeads, error: prevLeadsError } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .gte('registration_date', format(previousStart, 'yyyy-MM-dd'))
        .lte('registration_date', format(previousEnd, 'yyyy-MM-dd'));

      if (prevLeadsError) throw prevLeadsError;

      // Fetch current period revenue
      const { data: currentTransactions, error: transError } = await supabase
        .from('financial_transactions')
        .select('amount, type, status')
        .eq('organization_id', currentOrganization.id)
        .eq('type', 'receita')
        .eq('status', 'paid')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'));

      if (transError) throw transError;

      // Fetch previous period revenue
      const { data: previousTransactions, error: prevTransError } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('organization_id', currentOrganization.id)
        .eq('type', 'receita')
        .eq('status', 'paid')
        .gte('transaction_date', format(previousStart, 'yyyy-MM-dd'))
        .lte('transaction_date', format(previousEnd, 'yyyy-MM-dd'));

      if (prevTransError) throw prevTransError;

      // Fetch last 6 months data for evolution
      const sixMonthsAgo = subMonths(start, 5);
      const { data: evolutionLeads, error: evolutionError } = await supabase
        .from('leads')
        .select('registration_date, budget_total, status')
        .eq('organization_id', currentOrganization.id)
        .gte('registration_date', format(sixMonthsAgo, 'yyyy-MM-dd'))
        .lte('registration_date', format(end, 'yyyy-MM-dd'));

      if (evolutionError) throw evolutionError;

      // Calculate current period metrics
      const totalLeads = currentLeads?.length || 0;
      const leadsContacted = currentLeads?.filter(l => 
        l.status !== 'novo_lead'
      ).length || 0;
      const leadsScheduled = currentLeads?.filter(l => 
        l.status === 'agendado' || l.status === 'compareceu' || l.status === 'fechado'
      ).length || 0;
      const leadsAttended = currentLeads?.filter(l => 
        l.status === 'compareceu' || l.status === 'fechado' || l.evaluation_result === 'Fechou'
      ).length || 0;
      const leadsClosed = currentLeads?.filter(l => 
        l.status === 'fechado' || l.evaluation_result === 'Fechou'
      ).length || 0;

      // Calculate rates
      const conversionRate = totalLeads > 0 ? (leadsClosed / totalLeads) * 100 : 0;
      const schedulingRate = totalLeads > 0 ? (leadsScheduled / totalLeads) * 100 : 0;
      const attendanceRate = leadsScheduled > 0 ? (leadsAttended / leadsScheduled) * 100 : 0;
      const closingRate = leadsAttended > 0 ? (leadsClosed / leadsAttended) * 100 : 0;

      // Calculate financial metrics
      const monthlyRevenue = currentTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const averageTicket = leadsClosed > 0 ? monthlyRevenue / leadsClosed : 0;

      // Calculate previous period metrics
      const previousTotalLeads = previousLeads?.length || 0;
      const previousRevenue = previousTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Calculate growth
      const leadsGrowth = previousTotalLeads > 0 
        ? ((totalLeads - previousTotalLeads) / previousTotalLeads) * 100 
        : 0;
      const revenueGrowth = previousRevenue > 0 
        ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      // Calculate leads by source
      const sourceMap = new Map<string, number>();
      currentLeads?.forEach(lead => {
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
        .slice(0, 5);

      // Calculate monthly evolution
      const months = eachMonthOfInterval({ start: sixMonthsAgo, end });
      const monthlyEvolution = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const monthLeads = evolutionLeads?.filter(l => {
          const regDate = new Date(l.registration_date);
          return regDate >= monthStart && regDate <= monthEnd;
        }) || [];

        const monthRevenue = monthLeads
          .filter(l => l.status === 'fechado')
          .reduce((sum, l) => sum + (Number(l.budget_total) || 0), 0);

        return {
          month: format(month, 'MMM/yy'),
          leads: monthLeads.length,
          revenue: monthRevenue
        };
      });

      return {
        totalLeads,
        leadsContacted,
        leadsScheduled,
        leadsAttended,
        leadsClosed,
        conversionRate,
        schedulingRate,
        attendanceRate,
        closingRate,
        monthlyRevenue,
        averageTicket,
        previousTotalLeads,
        previousRevenue,
        leadsGrowth,
        revenueGrowth,
        leadsBySource,
        monthlyEvolution
      };
    },
    enabled: !!currentOrganization?.id,
  });
}
