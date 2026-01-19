import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';
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
  
  return useQuery({
    queryKey: ['salesDashboard', currentOrganization?.id, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
    queryFn: async (): Promise<SalesDashboardData> => {
      if (!currentOrganization?.id) throw new Error('No organization');

      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      // Fetch leads for the period
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*, procedures(name), sources(name)')
        .eq('organization_id', currentOrganization.id)
        .gte('created_at', startStr)
        .lte('created_at', endStr + 'T23:59:59')
        .limit(10000);

      if (leadsError) throw leadsError;

      // Fetch financial transactions
      const { data: transactions, error: txError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('type', 'income')
        .gte('transaction_date', startStr)
        .lte('transaction_date', endStr)
        .limit(10000);

      if (txError) throw txError;

      const allLeads = leads || [];
      const allTx = transactions || [];

      // Temperature breakdown
      const leadsByTemperature = {
        novo: allLeads.filter(l => l.temperature === 'novo').length,
        quente: allLeads.filter(l => l.temperature === 'quente').length,
        frio: allLeads.filter(l => l.temperature === 'frio').length,
        perdido: allLeads.filter(l => l.temperature === 'perdido').length,
      };

      // Hot substatus breakdown
      const hotLeads = allLeads.filter(l => l.temperature === 'quente');
      const hotSubstatus = {
        em_conversa: hotLeads.filter(l => l.hot_substatus === 'em_conversa').length,
        aguardando_resposta: hotLeads.filter(l => l.hot_substatus === 'aguardando_resposta').length,
        em_negociacao: hotLeads.filter(l => l.hot_substatus === 'em_negociacao').length,
        follow_up_agendado: hotLeads.filter(l => l.hot_substatus === 'follow_up_agendado').length,
      };

      // Scheduling
      const scheduledLeads = allLeads.filter(l => l.scheduled).length;
      const unscheduledLeads = allLeads.length - scheduledLeads;
      const schedulingRate = allLeads.length > 0 ? (scheduledLeads / allLeads.length) * 100 : 0;

      // Conversion funnel
      const leadsContacted = allLeads.filter(l => l.first_contact_date).length;
      const leadsScheduled = scheduledLeads;
      const leadsAttended = allLeads.filter(l => l.status === 'atendido' || l.status === 'fechado').length;
      const leadsClosed = allLeads.filter(l => l.status === 'fechado').length;

      // Financial
      const monthlyRevenue = allTx.reduce((sum, t) => sum + (t.amount || 0), 0);
      const averageTicket = leadsClosed > 0 ? monthlyRevenue / leadsClosed : 0;

      // By interest
      const interestCounts: Record<string, number> = {};
      allLeads.forEach(l => {
        const name = l.procedures?.name || 'Sem interesse';
        interestCounts[name] = (interestCounts[name] || 0) + 1;
      });
      const leadsByInterest = Object.entries(interestCounts).map(([name, value]) => ({
        name,
        value,
        percentage: allLeads.length > 0 ? (value / allLeads.length) * 100 : 0,
      }));

      // By source
      const sourceCounts: Record<string, number> = {};
      allLeads.forEach(l => {
        const name = l.sources?.name || 'Sem origem';
        sourceCounts[name] = (sourceCounts[name] || 0) + 1;
      });
      const leadsBySource = Object.entries(sourceCounts).map(([name, value]) => ({
        name,
        value,
        percentage: allLeads.length > 0 ? (value / allLeads.length) * 100 : 0,
      }));

      return {
        leadsByTemperature,
        hotSubstatus,
        scheduledLeads,
        unscheduledLeads,
        schedulingRate,
        totalLeads: allLeads.length,
        leadsContacted,
        leadsScheduled,
        leadsAttended,
        leadsClosed,
        monthlyRevenue,
        averageTicket,
        leadsGrowth: 0, // Would need previous period data
        revenueGrowth: 0,
        leadsByInterest,
        leadsBySource,
        monthlyEvolution: [],
      };
    },
    enabled: !!currentOrganization?.id,
  });
}
