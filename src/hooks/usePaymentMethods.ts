import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'dinheiro' | 'pix' | 'credito' | 'debito' | 'boleto' | 'transferencia';
  active: boolean;
  created_at: string;
}

export function usePaymentMethods() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['payment-methods', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as PaymentMethod[];
    },
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (method: Partial<PaymentMethod>) => {
      if (!currentOrganization?.id) throw new Error("No organization selected");
      
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([{
          ...method,
          organization_id: currentOrganization.id
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Forma de pagamento criada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating payment method:', error);
      toast.error('Erro ao criar forma de pagamento');
    },
  });
}
