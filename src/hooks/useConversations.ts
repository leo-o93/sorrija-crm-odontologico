import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEffect } from 'react';

export interface Conversation {
  id: string;
  organization_id: string;
  contact_type: 'lead' | 'patient';
  lead_id: string | null;
  patient_id: string | null;
  channel: string;
  evolution_instance: string | null;
  phone: string;
  status: 'open' | 'pending' | 'resolved' | 'archived';
  assigned_user_id: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
  leads?: {
    id: string;
    name: string;
    interest_id: string | null;
    status: string;
  };
  patients?: {
    id: string;
    name: string;
    email: string | null;
  };
}

export function useConversations(status: string = 'open', search: string = '') {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conversations', currentOrganization?.id, status, search],
    queryFn: async () => {
      if (!currentOrganization) return [];

      let query = supabase
        .from('conversations')
        .select(`
          *,
          leads(id, name, interest_id, status),
          patients(id, name, email)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`phone.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!currentOrganization,
  });

  // Realtime subscription
  useEffect(() => {
    if (!currentOrganization) return;

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization, refetch]);

  return {
    conversations: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useConversation(conversationId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          leads(id, name, phone, interest_id, status, notes),
          patients(id, name, phone, email)
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return data as Conversation;
    },
    enabled: !!conversationId,
  });

  return {
    conversation: data,
    isLoading,
    error,
  };
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, updates }: { conversationId: string; updates: Partial<Conversation> }) => {
      const { data, error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}
