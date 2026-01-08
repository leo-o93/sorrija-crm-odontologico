import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from '@/hooks/use-toast';

export type ReportType = 'leads_analysis' | 'conversations_analysis' | 'performance_analysis' | 'recommendations' | 'full_report';

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
}

export interface AIReportResponse {
  success: boolean;
  type: ReportType;
  stats: AIReportStats;
  report: any;
  generated_at: string;
  date_range: {
    start: string;
    end: string;
  };
}

export function useAIReports() {
  const { currentOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<AIReportResponse | null>(null);

  const generateReport = async (
    type: ReportType = 'full_report',
    dateRange?: { start: Date; end: Date }
  ) => {
    if (!currentOrganization?.id) {
      toast({
        title: 'Erro',
        description: 'Organização não selecionada',
        variant: 'destructive'
      });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-reports', {
        body: {
          type,
          organization_id: currentOrganization.id,
          date_range: dateRange ? {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          } : undefined
        }
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setReportData(data as AIReportResponse);
      return data as AIReportResponse;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar relatório';
      setError(message);
      toast({
        title: 'Erro ao gerar relatório',
        description: message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearReport = () => {
    setReportData(null);
    setError(null);
  };

  return {
    generateReport,
    clearReport,
    isLoading,
    error,
    reportData
  };
}
