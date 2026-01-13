import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface CampaignResult {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  results: {
    success: string[];
    failed: string[];
    errors: Record<string, string>;
  };
}

export function useCampaignSend() {
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);
  const { currentOrganization } = useOrganization();

  const sendCampaign = async (leadIds: string[], templateId: string): Promise<CampaignResult | null> => {
    if (!currentOrganization?.id) {
      toast.error('Organização não selecionada');
      return null;
    }

    if (leadIds.length === 0) {
      toast.error('Selecione ao menos um lead');
      return null;
    }

    if (!templateId) {
      toast.error('Selecione um template de mensagem');
      return null;
    }

    setIsSending(true);
    setProgress({ sent: 0, total: leadIds.length });

    try {
      // Show initial toast
      const toastId = toast.loading(`Enviando mensagens para ${leadIds.length} leads...`, {
        description: 'Isso pode levar alguns minutos. Não feche esta aba.',
        duration: Infinity,
      });

      const { data, error } = await supabase.functions.invoke('campaign-send', {
        body: {
          organization_id: currentOrganization.id,
          lead_ids: leadIds,
          template_id: templateId,
        },
      });

      toast.dismiss(toastId);

      if (error) {
        console.error('Campaign send error:', error);
        toast.error('Erro ao enviar campanha', {
          description: error.message,
        });
        return null;
      }

      const result = data as CampaignResult;
      
      setProgress({ sent: result.sent, total: result.total });

      if (result.sent === result.total) {
        toast.success(`Campanha concluída com sucesso!`, {
          description: `${result.sent} mensagens enviadas`,
        });
      } else if (result.sent > 0) {
        toast.warning(`Campanha concluída parcialmente`, {
          description: `${result.sent} enviadas, ${result.failed} falharam`,
        });
      } else {
        toast.error('Falha ao enviar campanha', {
          description: `Nenhuma mensagem foi enviada`,
        });
      }

      return result;

    } catch (err) {
      console.error('Campaign send error:', err);
      toast.error('Erro ao enviar campanha');
      return null;
    } finally {
      setIsSending(false);
      setTimeout(() => setProgress(null), 5000);
    }
  };

  return {
    sendCampaign,
    isSending,
    progress,
  };
}
