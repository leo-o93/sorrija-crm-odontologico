import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface Webhook {
  id: string;
  created_at: string;
  method: string;
  path: string | null;
  origin: string | null;
  headers: Record<string, string> | null;
  query_params: Record<string, string> | null;
  payload: any;
  ip_address: string | null;
  user_agent: string | null;
  status: 'received' | 'processed' | 'failed';
  processed_at: string | null;
  error_message: string | null;
}

export function useWebhooks() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["webhooks", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Webhook[];
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("webhooks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook deletado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao deletar webhook: ${error.message}`);
    },
  });

  const updateWebhookStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      errorMessage 
    }: { 
      id: string; 
      status: 'received' | 'processed' | 'failed'; 
      errorMessage?: string 
    }) => {
      const { error } = await supabase
        .from("webhooks")
        .update({
          status,
          processed_at: status !== 'received' ? new Date().toISOString() : null,
          error_message: errorMessage || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Status atualizado");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  return {
    webhooks,
    isLoading,
    deleteWebhook: deleteWebhook.mutate,
    updateWebhookStatus: updateWebhookStatus.mutate,
  };
}
