import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface RecurringPayment {
  id: string;
  description: string;
  amount: number;
  category_id: string | null;
  supplier_id: string | null;
  payment_method_id: string | null;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  last_generated_date: string | null;
  active: boolean;
  organization_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: { name: string };
  expense_categories?: { name: string };
}

export function useRecurringPayments() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['recurring-payments', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('recurring_payments')
        .select(`
          *,
          suppliers(name),
          expense_categories(name)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('next_due_date', { ascending: true });

      if (error) throw error;
      return data as RecurringPayment[];
    },
  });
}

export function useCreateRecurringPayment() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: Partial<RecurringPayment>) => {
      if (!currentOrganization?.id) throw new Error('No organization selected');

      const { data, error } = await supabase
        .from('recurring_payments')
        .insert([
          {
            ...input,
            organization_id: currentOrganization.id,
          } as RecurringPayment,
        ])
        .select()
        .single();

      if (error) throw error;
      return data as RecurringPayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-payments'] });
      toast.success('Recorrência criada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating recurring payment:', error);
      toast.error('Erro ao criar recorrência');
    },
  });
}

export function useUpdateRecurringPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecurringPayment> & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RecurringPayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-payments'] });
      toast.success('Recorrência atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Error updating recurring payment:', error);
      toast.error('Erro ao atualizar recorrência');
    },
  });
}

export function useDeleteRecurringPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_payments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-payments'] });
      toast.success('Recorrência removida com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting recurring payment:', error);
      toast.error('Erro ao remover recorrência');
    },
  });
}

export function useGenerateRecurringTransactions() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async () => {
      if (!currentOrganization?.id) throw new Error('No organization selected');

      const { data: recurring, error } = await supabase
        .from('recurring_payments')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('active', true)
        .lte('next_due_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      const transactions = (recurring || []).map((payment) => ({
        type: 'despesa',
        category_id: payment.category_id,
        payment_method_id: payment.payment_method_id,
        amount: payment.amount,
        description: payment.description,
        due_date: payment.next_due_date,
        status: 'pending',
        supplier_id: payment.supplier_id,
        recurring_payment_id: payment.id,
        organization_id: currentOrganization.id,
      }));

      if (transactions.length === 0) {
        return { generated: 0 };
      }

      const { error: insertError } = await supabase
        .from('financial_transactions')
        .insert(transactions);

      if (insertError) throw insertError;

      const nextUpdates = (recurring || []).map((payment) => ({
        id: payment.id,
        last_generated_date: payment.next_due_date,
      }));

      for (const update of nextUpdates) {
        await supabase
          .from('recurring_payments')
          .update(update)
          .eq('id', update.id);
      }

      return { generated: transactions.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-payments'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success(`Geradas ${data.generated} transações recorrentes`);
    },
    onError: (error) => {
      console.error('Error generating recurring transactions:', error);
      toast.error('Erro ao gerar transações recorrentes');
    },
  });
}
