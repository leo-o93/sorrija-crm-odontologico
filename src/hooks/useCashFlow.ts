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
      const todayStr = today.toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(today.getDate() + 90);

      // 1. Buscar saldo inicial: todas as transações PAGAS até hoje
      const { data: historicalData, error: historicalError } = await supabase
        .from('financial_transactions')
        .select('type, amount, status')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'paid')
        .lt('transaction_date', todayStr);

      if (historicalError) throw historicalError;

      // Calcular saldo inicial
      const initialBalance = (historicalData || []).reduce((sum, tx) => {
        const amount = Number(tx.amount || 0);
        return tx.type === 'receita' ? sum + amount : sum - amount;
      }, 0);

      // 2. Buscar transações futuras E transações pendentes do passado
      const { data: transactions, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .or(`transaction_date.gte.${todayStr},and(status.in.(pending,scheduled,partial),transaction_date.lt.${todayStr})`)
        .lte('transaction_date', endDate.toISOString());

      if (transactionsError) throw transactionsError;

      // 3. Buscar pagamentos recorrentes
      const { data: recurring, error: recurringError } = includeRecurring
        ? await supabase
            .from('recurring_payments')
            .select('*')
            .eq('organization_id', currentOrganization.id)
            .eq('active', true)
        : { data: [], error: null };

      if (recurringError) throw recurringError;

      // 4. Construir projeção diária
      const entries: CashFlowEntry[] = [];
      let runningBalance = initialBalance;

      // Adicionar transações pendentes do passado ao dia de hoje
      const pastPendingTransactions = (transactions || []).filter(tx => {
        const txDate = tx.transaction_date?.split('T')[0];
        return txDate && txDate < todayStr && tx.status !== 'paid';
      });

      for (let i = 0; i <= 90; i += 1) {
        const current = new Date();
        current.setDate(today.getDate() + i);
        const dateKey = current.toISOString().split('T')[0];

        let dailyTransactions = (transactions || []).filter(
          (tx) => tx.transaction_date?.split('T')[0] === dateKey
        );

        // No primeiro dia, incluir transações pendentes do passado
        if (i === 0) {
          dailyTransactions = [...dailyTransactions, ...pastPendingTransactions];
        }

        // Calcular projetado (todas as transações)
        const projected = dailyTransactions.reduce((sum, tx) => {
          const amount = Number(tx.amount || 0);
          return tx.type === 'receita' ? sum + amount : sum - amount;
        }, 0);

        // Calcular realizado (apenas transações pagas)
        const realized = dailyTransactions
          .filter((tx) => tx.status === 'paid')
          .reduce((sum, tx) => {
            const amount = Number(tx.amount || 0);
            return tx.type === 'receita' ? sum + amount : sum - amount;
          }, 0);

        // Calcular projeção de recorrentes
        const recurringProjected = includeRecurring
          ? (recurring || []).reduce((sum, payment) => {
              const nextDueDate = payment.next_due_date?.split('T')[0];
              if (nextDueDate === dateKey) {
                return sum - Number(payment.amount || 0);
              }
              
              // Verificar se há múltiplas ocorrências dentro do período
              if (payment.frequency === 'weekly') {
                const paymentDate = new Date(payment.next_due_date);
                const currentDate = new Date(dateKey);
                const daysDiff = Math.floor((currentDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff > 0 && daysDiff % 7 === 0) {
                  return sum - Number(payment.amount || 0);
                }
              } else if (payment.frequency === 'monthly' && payment.day_of_month) {
                const currentDate = new Date(dateKey);
                if (currentDate.getDate() === payment.day_of_month) {
                  return sum - Number(payment.amount || 0);
                }
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
