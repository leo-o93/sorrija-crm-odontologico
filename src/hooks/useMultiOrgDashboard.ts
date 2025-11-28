import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface OrgMetrics {
  organizationId: string;
  organizationName: string;
  evolutionInstance: string;
  totalLeads: number;
  closedLeads: number;
  revenue: number;
  conversionRate: number;
  activeConversations: number;
}

export function useMultiOrgDashboard(startDate?: Date, endDate?: Date) {
  const { user } = useAuth();
  const start = startDate || startOfMonth(new Date());
  const end = endDate || endOfMonth(new Date());

  return useQuery({
    queryKey: ['multi-org-dashboard', format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user) return [];

      // Buscar todas as organizações do usuário
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(*)')
        .eq('user_id', user.id)
        .eq('active', true);

      if (memberError) throw memberError;

      const organizations = memberships
        .map(m => m.organizations)
        .filter((org): org is any => org !== null && org.active);

      // Para cada organização, buscar métricas
      const metrics: OrgMetrics[] = await Promise.all(
        organizations.map(async (org) => {
          // Buscar leads
          const { data: leads } = await supabase
            .from('leads')
            .select('id, status, budget_total')
            .eq('organization_id', org.id)
            .gte('registration_date', format(start, 'yyyy-MM-dd'))
            .lte('registration_date', format(end, 'yyyy-MM-dd'));

          const totalLeads = leads?.length || 0;
          const closedLeads = leads?.filter(l => l.status === 'fechado').length || 0;
          const revenue = leads
            ?.filter(l => l.status === 'fechado')
            .reduce((sum, l) => sum + (Number(l.budget_total) || 0), 0) || 0;

          // Buscar conversas ativas
          const { count: activeConversations } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .eq('status', 'open');

          return {
            organizationId: org.id,
            organizationName: org.name,
            evolutionInstance: org.evolution_instance,
            totalLeads,
            closedLeads,
            revenue,
            conversionRate: totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0,
            activeConversations: activeConversations || 0,
          };
        })
      );

      return metrics;
    },
    enabled: !!user,
  });
}