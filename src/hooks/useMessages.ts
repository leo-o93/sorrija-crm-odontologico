import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface Message {
  id: string;
  conversation_id: string;
  direction: 'in' | 'out';
  type: 'text' | 'image' | 'audio' | 'document' | 'video' | 'template';
  content_text: string | null;
  media_url: string | null;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'received' | 'failed';
  provider_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_by_user_id: string | null;
  raw_payload: any;
  created_at: string;
  updated_at: string;
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, refetch]);

  return {
    messages: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      leadId,
      patientId,
      phone,
      type,
      text,
      media,
    }: {
      conversationId?: string;
      leadId?: string;
      patientId?: string;
      phone: string;
      type: string;
      text?: string;
      media?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('messages-send', {
        body: {
          conversation_id: conversationId,
          lead_id: leadId,
          patient_id: patientId,
          phone,
          type,
          text,
          media,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Mensagem enviada com sucesso');
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    },
  });
}
