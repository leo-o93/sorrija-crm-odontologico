import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface AIReportStats {
  total_leads: number;
  leads_by_temperature: {
    quente: number;
    morno: number;
    frio: number;
    novo: number;
  };
  leads_by_substatus: {
    em_conversa: number;
    aguardando_resposta: number;
    agendado: number;
    negociacao: number;
    fechado: number;
  };
  total_conversations: number;
  open_conversations: number;
  total_messages: number;
  messages_in: number;
  messages_out: number;
  appointments_scheduled: number;
  appointments_completed: number;
  appointments_cancelled: number;
  leads_without_response_24h: number;
  hot_leads_without_response_today: number;
}

export function useAIReportStats(dateRange?: { start: Date; end: Date }) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['ai-report-stats', currentOrganization?.id, dateRange?.start, dateRange?.end],
    queryFn: async (): Promise<AIReportStats> => {
      if (!currentOrganization?.id) throw new Error('No organization');

      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.end || new Date();

      // Fetch all data in parallel
      const [leadsResult, conversationsResult, messagesResult, appointmentsResult] = await Promise.all([
        supabase
          .from('leads')
          .select('id, temperature, hot_substatus, created_at, last_interaction_at')
          .eq('organization_id', currentOrganization.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('conversations')
          .select('id, status, last_message_at')
          .eq('organization_id', currentOrganization.id),
        supabase
          .from('messages')
          .select('id, direction, created_at')
          .eq('organization_id', currentOrganization.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('appointments')
          .select('id, status, appointment_date')
          .eq('organization_id', currentOrganization.id)
          .gte('appointment_date', startDate.toISOString())
          .lte('appointment_date', endDate.toISOString())
      ]);

      const leads = leadsResult.data || [];
      const conversations = conversationsResult.data || [];
      const messages = messagesResult.data || [];
      const appointments = appointmentsResult.data || [];

      // Calculate temperature distribution
      const leads_by_temperature = {
        quente: leads.filter(l => l.temperature === 'quente').length,
        morno: leads.filter(l => l.temperature === 'morno').length,
        frio: leads.filter(l => l.temperature === 'frio').length,
        novo: leads.filter(l => l.temperature === 'novo' || !l.temperature).length,
      };

      // Calculate substatus distribution for hot leads
      const hotLeads = leads.filter(l => l.temperature === 'quente');
      const leads_by_substatus = {
        em_conversa: hotLeads.filter(l => l.hot_substatus === 'em_conversa').length,
        aguardando_resposta: hotLeads.filter(l => l.hot_substatus === 'aguardando_resposta').length,
        agendado: hotLeads.filter(l => l.hot_substatus === 'agendado').length,
        negociacao: hotLeads.filter(l => l.hot_substatus === 'negociacao').length,
        fechado: hotLeads.filter(l => l.hot_substatus === 'fechado').length,
      };

      // Calculate message stats
      const messages_in = messages.filter(m => m.direction === 'in').length;
      const messages_out = messages.filter(m => m.direction === 'out').length;

      // Calculate appointment stats
      const appointments_scheduled = appointments.filter(a => a.status === 'scheduled' || a.status === 'rescheduled').length;
      const appointments_completed = appointments.filter(a => a.status === 'attended').length;
      const appointments_cancelled = appointments.filter(a => a.status === 'cancelled' || a.status === 'no_show').length;

      // Calculate alerts
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const leads_without_response_24h = leads.filter(l => {
        const lastInteraction = l.last_interaction_at ? new Date(l.last_interaction_at) : new Date(l.created_at);
        return lastInteraction < twentyFourHoursAgo && l.temperature !== 'frio';
      }).length;

      const hot_leads_without_response_today = hotLeads.filter(l => {
        const lastInteraction = l.last_interaction_at ? new Date(l.last_interaction_at) : null;
        return !lastInteraction || lastInteraction < todayStart;
      }).length;

      return {
        total_leads: leads.length,
        leads_by_temperature,
        leads_by_substatus,
        total_conversations: conversations.length,
        open_conversations: conversations.filter(c => c.status === 'open').length,
        total_messages: messages.length,
        messages_in,
        messages_out,
        appointments_scheduled,
        appointments_completed,
        appointments_cancelled,
        leads_without_response_24h,
        hot_leads_without_response_today,
      };
    },
    enabled: !!currentOrganization?.id,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 10000,
  });
}
