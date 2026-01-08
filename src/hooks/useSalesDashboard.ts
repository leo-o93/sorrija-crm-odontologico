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

      const { data, error } = await supabase.rpc('get_sales_dashboard_data', {
        p_organization_id: currentOrganization.id,
        p_start_date: format(start, 'yyyy-MM-dd'),
        p_end_date: format(end, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      if (!data) throw new Error('No sales dashboard data');

      return data as SalesDashboardData;
    },
    enabled: !!currentOrganization?.id,
  });
}
