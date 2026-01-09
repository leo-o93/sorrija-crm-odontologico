import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  source: string;
}

export interface SystemStats {
  whatsappStatus: 'connected' | 'disconnected' | 'connecting' | 'error' | 'not_configured';
  whatsappInstance: string | null;
  leadsCount: { total: number; hot: number; warm: number; cold: number; new: number };
  conversationsCount: { total: number; open: number; closed: number };
  messagesToday: number;
  webhooksLast24h: number;
  lastAutoTransition: Date | null;
  recentWebhooks: any[];
  systemAlerts: SystemAlert[];
}

export function useSystemMonitoring() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentOrganization?.id) return undefined;

    const channel = supabase
      .channel('system-monitoring-webhooks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhooks',
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['system-monitoring', currentOrganization.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization?.id, queryClient]);

  return useQuery<SystemStats>({
    queryKey: ['system-monitoring', currentOrganization?.id],
    enabled: !!currentOrganization?.id,
    refetchInterval: 30000,
    queryFn: async () => {
      if (!currentOrganization?.id) {
        return {
          whatsappStatus: 'not_configured',
          whatsappInstance: null,
          leadsCount: { total: 0, hot: 0, warm: 0, cold: 0, new: 0 },
          conversationsCount: { total: 0, open: 0, closed: 0 },
          messagesToday: 0,
          webhooksLast24h: 0,
          lastAutoTransition: null,
          recentWebhooks: [],
          systemAlerts: [],
        };
      }

      const orgId = currentOrganization.id;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: whatsappData } = await supabase.functions.invoke('check-whatsapp-status', {
        body: { organizationId: orgId },
      });

      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('temperature, last_interaction_at')
        .eq('organization_id', orgId);

      if (leadsError) throw leadsError;

      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('status')
        .eq('organization_id', orgId);

      if (conversationsError) throw conversationsError;

      const { count: messagesTodayCount, error: messagesError } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', todayStart.toISOString());

      if (messagesError) throw messagesError;

      const { count: webhooksLast24hCount, error: webhooksError } = await supabase
        .from('webhooks')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', last24h);

      if (webhooksError) throw webhooksError;

      const { data: recentWebhooks, error: recentWebhooksError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (recentWebhooksError) throw recentWebhooksError;

      const { data: failedMessages } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgId)
        .eq('status', 'failed');

      const leadsList = leads || [];
      const hotLeadsWithoutInteraction = leadsList.filter((lead) => {
        if (!lead.last_interaction_at) return true;
        const hoursSince = (Date.now() - new Date(lead.last_interaction_at).getTime()) / (1000 * 60 * 60);
        return hoursSince > 24 && lead.temperature === 'quente';
      });

      const alerts: SystemAlert[] = [];
      if (hotLeadsWithoutInteraction.length > 0) {
        alerts.push({
          id: 'hot-leads-stale',
          level: 'warning',
          message: `${hotLeadsWithoutInteraction.length} leads quentes sem interação há mais de 24h`,
          timestamp: new Date(),
          source: 'CRM',
        });
      }

      if (whatsappData?.status && whatsappData.status !== 'open') {
        alerts.push({
          id: 'whatsapp-disconnected',
          level: 'error',
          message: 'WhatsApp desconectado. Verifique a integração.',
          timestamp: new Date(),
          source: 'WhatsApp',
        });
      }

      if ((failedMessages as any)?.length) {
        alerts.push({
          id: 'message-failures',
          level: 'error',
          message: 'Há mensagens com falha de envio.',
          timestamp: new Date(),
          source: 'Mensagens',
        });
      }

      const leadsCount = {
        total: leadsList.length,
        hot: leadsList.filter((lead) => lead.temperature === 'quente').length,
        warm: leadsList.filter((lead) => lead.temperature === 'morno').length,
        cold: leadsList.filter((lead) => lead.temperature === 'frio').length,
        new: leadsList.filter((lead) => lead.temperature === 'novo' || !lead.temperature).length,
      };

      const conversationsList = conversations || [];
      const conversationsCount = {
        total: conversationsList.length,
        open: conversationsList.filter((conv) => conv.status === 'open').length,
        closed: conversationsList.filter((conv) => conv.status === 'resolved').length,
      };

      const whatsappStatus = whatsappData?.status === 'open'
        ? 'connected'
        : whatsappData?.status === 'close'
          ? 'disconnected'
          : whatsappData?.status === 'not_configured'
            ? 'not_configured'
            : whatsappData?.status || 'error';

      return {
        whatsappStatus,
        whatsappInstance: whatsappData?.instance || null,
        leadsCount,
        conversationsCount,
        messagesToday: messagesTodayCount || 0,
        webhooksLast24h: webhooksLast24hCount || 0,
        lastAutoTransition: null,
        recentWebhooks: recentWebhooks || [],
        systemAlerts: alerts,
      };
    },
  });
}
