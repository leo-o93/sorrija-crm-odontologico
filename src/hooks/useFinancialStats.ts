import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export function useFinancialStats(startDate?: Date, endDate?: Date) {
  const start = startDate || startOfMonth(new Date());
  const end = endDate || endOfMonth(new Date());

  return useQuery({
    queryKey: ['financial-stats', format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('type, amount, status, transaction_date')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      const receitas = data
        .filter(t => t.type === 'receita' && t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const despesas = data
        .filter(t => t.type === 'despesa' && t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const receitasPendentes = data
        .filter(t => t.type === 'receita' && t.status === 'pending')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const despesasPendentes = data
        .filter(t => t.type === 'despesa' && t.status === 'pending')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const lucro = receitas - despesas;
      const lucroProjetado = (receitas + receitasPendentes) - (despesas + despesasPendentes);

      return {
        receitas,
        despesas,
        lucro,
        receitasPendentes,
        despesasPendentes,
        lucroProjetado,
      };
    },
  });
}
