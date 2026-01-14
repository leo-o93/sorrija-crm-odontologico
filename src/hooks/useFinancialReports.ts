import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { startOfMonth, endOfMonth, subMonths, subYears, format } from 'date-fns';

export interface DREData {
  revenues: { category: string; amount: number }[];
  expenses: { category: string; amount: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netResult: number;
}

export interface ProcedureRanking {
  name: string;
  count: number;
  revenue: number;
}

export interface CategoryBreakdown {
  name: string;
  amount: number;
  percentage: number;
  color?: string;
}

export interface ComparativeData {
  currentMonth: { revenue: number; expenses: number; result: number };
  previousMonth: { revenue: number; expenses: number; result: number };
  currentYear: { revenue: number; expenses: number; result: number };
  previousYear: { revenue: number; expenses: number; result: number };
  monthVariation: { revenue: number; expenses: number; result: number };
  yearVariation: { revenue: number; expenses: number; result: number };
}

export function useDREReport(startDate: Date, endDate: Date) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['dre-report', currentOrganization?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<DREData> => {
      if (!currentOrganization?.id) {
        return { revenues: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netResult: 0 };
      }

      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          type,
          amount,
          status,
          expense_categories(name)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'paid')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());

      if (error) throw error;

      const revenueMap = new Map<string, number>();
      const expenseMap = new Map<string, number>();

      (data || []).forEach((tx: any) => {
        const category = tx.expense_categories?.name || 'Outros';
        const amount = Number(tx.amount || 0);

        if (tx.type === 'receita') {
          revenueMap.set(category, (revenueMap.get(category) || 0) + amount);
        } else {
          expenseMap.set(category, (expenseMap.get(category) || 0) + amount);
        }
      });

      const revenues = Array.from(revenueMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      const expenses = Array.from(expenseMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const netResult = totalRevenue - totalExpenses;

      return { revenues, expenses, totalRevenue, totalExpenses, netResult };
    },
  });
}

export function useProcedureRanking(startDate: Date, endDate: Date) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['procedure-ranking', currentOrganization?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<ProcedureRanking[]> => {
      if (!currentOrganization?.id) return [];

      // Buscar orçamentos aprovados/pagos no período
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id,
          final_amount,
          status,
          quote_items(procedure_name, total_price, quantity)
        `)
        .eq('organization_id', currentOrganization.id)
        .in('status', ['approved', 'paid', 'partial'])
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (quotesError) throw quotesError;

      const procedureMap = new Map<string, { count: number; revenue: number }>();

      (quotes || []).forEach((quote: any) => {
        (quote.quote_items || []).forEach((item: any) => {
          const existing = procedureMap.get(item.procedure_name) || { count: 0, revenue: 0 };
          procedureMap.set(item.procedure_name, {
            count: existing.count + (item.quantity || 1),
            revenue: existing.revenue + Number(item.total_price || 0),
          });
        });
      });

      return Array.from(procedureMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue);
    },
  });
}

export function useCategoryBreakdown(startDate: Date, endDate: Date, type: 'receita' | 'despesa' = 'despesa') {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['category-breakdown', currentOrganization?.id, type, startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<CategoryBreakdown[]> => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          amount,
          expense_categories(name, color)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('type', type)
        .eq('status', 'paid')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());

      if (error) throw error;

      const categoryMap = new Map<string, { amount: number; color?: string }>();

      (data || []).forEach((tx: any) => {
        const category = tx.expense_categories?.name || 'Outros';
        const color = tx.expense_categories?.color;
        const existing = categoryMap.get(category) || { amount: 0, color };
        categoryMap.set(category, {
          amount: existing.amount + Number(tx.amount || 0),
          color: existing.color || color,
        });
      });

      const total = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.amount, 0);

      return Array.from(categoryMap.entries())
        .map(([name, data]) => ({
          name,
          amount: data.amount,
          percentage: total > 0 ? (data.amount / total) * 100 : 0,
          color: data.color,
        }))
        .sort((a, b) => b.amount - a.amount);
    },
  });
}

export function useComparativeReport() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['comparative-report', currentOrganization?.id],
    queryFn: async (): Promise<ComparativeData> => {
      if (!currentOrganization?.id) {
        return {
          currentMonth: { revenue: 0, expenses: 0, result: 0 },
          previousMonth: { revenue: 0, expenses: 0, result: 0 },
          currentYear: { revenue: 0, expenses: 0, result: 0 },
          previousYear: { revenue: 0, expenses: 0, result: 0 },
          monthVariation: { revenue: 0, expenses: 0, result: 0 },
          yearVariation: { revenue: 0, expenses: 0, result: 0 },
        };
      }

      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthEnd = endOfMonth(subMonths(now, 1));
      const currentYearStart = new Date(now.getFullYear(), 0, 1);
      const currentYearEnd = new Date(now.getFullYear(), 11, 31);
      const previousYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const previousYearEnd = new Date(now.getFullYear() - 1, 11, 31);

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('type, amount, transaction_date, status')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'paid')
        .gte('transaction_date', previousYearStart.toISOString())
        .lte('transaction_date', currentYearEnd.toISOString());

      if (error) throw error;

      const calculatePeriod = (transactions: any[], start: Date, end: Date) => {
        const filtered = transactions.filter((tx) => {
          const date = new Date(tx.transaction_date);
          return date >= start && date <= end;
        });

        const revenue = filtered
          .filter((tx) => tx.type === 'receita')
          .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        const expenses = filtered
          .filter((tx) => tx.type === 'despesa')
          .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        return { revenue, expenses, result: revenue - expenses };
      };

      const currentMonth = calculatePeriod(data || [], currentMonthStart, currentMonthEnd);
      const previousMonth = calculatePeriod(data || [], previousMonthStart, previousMonthEnd);
      const currentYear = calculatePeriod(data || [], currentYearStart, currentYearEnd);
      const previousYear = calculatePeriod(data || [], previousYearStart, previousYearEnd);

      const calculateVariation = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        currentMonth,
        previousMonth,
        currentYear,
        previousYear,
        monthVariation: {
          revenue: calculateVariation(currentMonth.revenue, previousMonth.revenue),
          expenses: calculateVariation(currentMonth.expenses, previousMonth.expenses),
          result: calculateVariation(currentMonth.result, previousMonth.result),
        },
        yearVariation: {
          revenue: calculateVariation(currentYear.revenue, previousYear.revenue),
          expenses: calculateVariation(currentYear.expenses, previousYear.expenses),
          result: calculateVariation(currentYear.result, previousYear.result),
        },
      };
    },
  });
}
