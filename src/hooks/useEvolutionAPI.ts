import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEvolution } from '@/contexts/EvolutionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConnectionState {
  state: 'open' | 'close' | 'connecting';
}

interface Contact {
  id: string;
  name: string;
  pushName?: string;
  profilePicUrl?: string;
}

// Clean Evolution API URL (remove /manager/ if present)
const cleanEvolutionUrl = (url: string): string => {
  return url.replace(/\/manager\/?$/, '');
};

export function useEvolutionAPI() {
  const { config } = useEvolution();
  const queryClient = useQueryClient();

  const fetchConnectionState = async (): Promise<ConnectionState> => {
    if (!config) throw new Error('Evolution API not configured');

    const cleanUrl = cleanEvolutionUrl(config.evolution_base_url);
    const response = await fetch(
      `${cleanUrl}/instance/connectionState/${config.evolution_instance}`,
      {
        headers: {
          'apikey': config.evolution_api_key,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch connection state');
    }

    return response.json();
  };

  const fetchQRCode = async (): Promise<{ code: string; base64: string }> => {
    if (!config) throw new Error('Evolution API not configured');

    const cleanUrl = cleanEvolutionUrl(config.evolution_base_url);
    const response = await fetch(
      `${cleanUrl}/instance/connect/${config.evolution_instance}`,
      {
        method: 'GET',
        headers: {
          'apikey': config.evolution_api_key,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch QR code');
    }

    return response.json();
  };

  const fetchContacts = async (): Promise<Contact[]> => {
    if (!config) throw new Error('Evolution API not configured');

    const cleanUrl = cleanEvolutionUrl(config.evolution_base_url);
    const response = await fetch(
      `${cleanUrl}/chat/findContacts/${config.evolution_instance}`,
      {
        headers: {
          'apikey': config.evolution_api_key,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    return response.json();
  };

  const syncContacts = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-whatsapp-contacts');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.synced} contatos sincronizados com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sincronizar contatos: ${error.message}`);
    },
  });

  const syncMessages = useMutation({
    mutationFn: async (phone: string) => {
      const { data, error } = await supabase.functions.invoke('sync-message-history', {
        body: { phone, limit: 100 }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.synced} mensagens sincronizadas com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sincronizar mensagens: ${error.message}`);
    },
  });

  const testConnection = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-whatsapp-status');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.status === 'open') {
        toast.success('✅ Conexão com WhatsApp estabelecida!');
      } else if (data.status === 'close') {
        toast.warning('⚠️ WhatsApp desconectado. Gere um QR Code para conectar.');
      } else {
        toast.info(`Status: ${data.status}`);
      }
      refetchConnectionState();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao testar conexão: ${error.message}`);
    },
  });

  const { data: connectionState, refetch: refetchConnectionState } = useQuery({
    queryKey: ['evolution-connection-state', config?.evolution_instance],
    queryFn: fetchConnectionState,
    enabled: !!config,
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

  return {
    connectionState,
    refetchConnectionState,
    fetchQRCode,
    fetchContacts,
    syncContacts,
    syncMessages,
    testConnection,
    isConfigured: !!config,
  };
}
