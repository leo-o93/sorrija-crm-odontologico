import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePaginatedQuery, PaginationOptions } from '@/hooks/usePaginatedQuery';

export interface Conversation {
  id: string;
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
    phone: string;
    interest_id: string | null;
    source_id: string | null;
    status: string;
    notes: string | null;
    budget_total: number | null;
    budget_paid: number | null;
    registration_date: string;
    temperature: string | null;
    hot_substatus: string | null;
    last_interaction_at: string | null;
    follow_up_count: number | null;
    no_show_count: number | null;
    lost_reason: string | null;
    next_follow_up_date: string | null;
    scheduled: boolean;
    procedures?: {
      id: string;
      name: string;
      category: string;
    };
    sources?: {
      id: string;
      name: string;
      channel: string;
    };
  };
  patients?: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    birth_date: string | null;
    medical_history: string | null;
    allergies: string | null;
    medications: string | null;
    notes: string | null;
  };
}

export function useConversations(status: string = 'open', search: string = '') {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conversations', currentOrganization?.id, status, search],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from('conversations')
        .select(`
          *,
          leads(
            id, name, phone, interest_id, source_id, status, notes, 
            budget_total, budget_paid, registration_date,
            temperature, hot_substatus, last_interaction_at,
            follow_up_count, no_show_count, lost_reason, next_follow_up_date, scheduled,
            procedures:interest_id(id, name, category),
            sources:source_id(id, name, channel)
          ),
          patients(
            id, name, email, phone, birth_date, 
            medical_history, allergies, medications, notes
          )
        `)
        .eq("organization_id", currentOrganization.id)
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
  });

  // Realtime subscription
  useEffect(() => {
    if (!currentOrganization?.id) {
      return undefined;
    }

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
  }, [currentOrganization?.id, refetch]);

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
          leads(
            id, name, phone, interest_id, source_id, status, notes,
            budget_total, budget_paid, registration_date,
            temperature, hot_substatus, last_interaction_at,
            follow_up_count, no_show_count, lost_reason, next_follow_up_date, scheduled,
            procedures:interest_id(id, name, category),
            sources:source_id(id, name, channel)
          ),
          patients(
            id, name, email, phone, birth_date,
            medical_history, allergies, medications, notes
          )
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

export function useConversationsPaginated(options: PaginationOptions) {
  const { currentOrganization } = useOrganization();

  return usePaginatedQuery<Conversation>({
    table: 'conversations',
    select: `
      *,
      leads(
        id, name, phone, interest_id, source_id, status, notes, 
        budget_total, budget_paid, registration_date,
        temperature, hot_substatus, last_interaction_at,
        follow_up_count, no_show_count, lost_reason, next_follow_up_date, scheduled,
        procedures:interest_id(id, name, category),
        sources:source_id(id, name, channel)
      ),
      patients(
        id, name, email, phone, birth_date, 
        medical_history, allergies, medications, notes
      )
    `,
    organizationId: currentOrganization?.id,
    options,
    queryKey: ['conversations-paginated', currentOrganization?.id, options],
  });
}
