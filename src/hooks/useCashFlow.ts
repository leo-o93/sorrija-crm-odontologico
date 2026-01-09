import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface CashFlowEntry {
  date: string;
  projected: number;
  realized: number;
  balance: number;
}

export function useCashFlow({ includeRecurring = true } = {}) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['cash-flow', currentOrganization?.id, includeRecurring],
    queryFn: async () => {
      if (!currentOrganization?.id) return [] as CashFlowEntry[];

      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 90);

      const { data: transactions, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .gte('transaction_date', today.toISOString())
        .lte('transaction_date', endDate.toISOString());

      if (transactionsError) throw transactionsError;

      const { data: recurring, error: recurringError } = includeRecurring
        ? await supabase
            .from('recurring_payments')
            .select('*')
            .eq('organization_id', currentOrganization.id)
            .eq('active', true)
        : { data: [], error: null };

      if (recurringError) throw recurringError;

      const entries: CashFlowEntry[] = [];
      let runningBalance = 0;

      for (let i = 0; i <= 90; i += 1) {
        const current = new Date();
        current.setDate(today.getDate() + i);
        const dateKey = current.toISOString().split('T')[0];

        const dailyTransactions = (transactions || []).filter(
          (tx) => tx.transaction_date?.split('T')[0] === dateKey
        );

        const projected = dailyTransactions.reduce((sum, tx) => {
          return tx.type === 'receita' ? sum + Number(tx.amount) : sum - Number(tx.amount);
        }, 0);

        const realized = dailyTransactions
          .filter((tx) => tx.status === 'paid')
          .reduce((sum, tx) => (tx.type === 'receita' ? sum + Number(tx.amount) : sum - Number(tx.amount)), 0);

        const recurringProjected = includeRecurring
          ? (recurring || []).reduce((sum, payment) => {
              if (payment.next_due_date === dateKey) {
                return sum - Number(payment.amount);
              }
              return sum;
            }, 0)
          : 0;

        runningBalance += projected + recurringProjected;

        entries.push({
          date: dateKey,
          projected: projected + recurringProjected,
          realized,
          balance: runningBalance,
        });
      }

      return entries;
    },
  });
}
