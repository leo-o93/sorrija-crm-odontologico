import { useQuery, useMutation } from '@tanstack/react-query';
import { useEvolution } from '@/contexts/EvolutionContext';
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

export function useEvolutionAPI() {
  const { config } = useEvolution();

  const fetchConnectionState = async (): Promise<ConnectionState> => {
    if (!config) throw new Error('Evolution API not configured');

    const response = await fetch(
      `${config.evolution_base_url}/instance/connectionState/${config.evolution_instance}`,
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

    const response = await fetch(
      `${config.evolution_base_url}/instance/connect/${config.evolution_instance}`,
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

    const response = await fetch(
      `${config.evolution_base_url}/chat/findContacts/${config.evolution_instance}`,
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
      const contacts = await fetchContacts();
      
      // Aqui você pode chamar a edge function para sincronizar os contatos
      // com o banco de dados, criando/atualizando leads automaticamente
      
      return contacts;
    },
    onSuccess: () => {
      toast.success('Contatos sincronizados com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sincronizar contatos: ${error.message}`);
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
    isConfigured: !!config,
  };
}
