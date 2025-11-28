import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export function useLeadsReport(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['leads-report', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*, sources(name), procedures(name)')
        .gte('registration_date', format(startDate, 'yyyy-MM-dd'))
        .lte('registration_date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      const total = leads.length;
      const scheduled = leads.filter(l => l.scheduled).length;
      const closed = leads.filter(l => l.status === 'fechado').length;
      
      // Group by status
      const byStatus = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by source
      const bySource = leads.reduce((acc, lead) => {
        const sourceName = lead.sources?.name || 'Sem fonte';
        acc[sourceName] = (acc[sourceName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Monthly evolution
      const byMonth = leads.reduce((acc, lead) => {
        const month = format(new Date(lead.registration_date), 'MMM/yyyy');
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total,
        scheduled,
        closed,
        conversionRate: total > 0 ? (closed / total) * 100 : 0,
        schedulingRate: total > 0 ? (scheduled / total) * 100 : 0,
        byStatus,
        bySource,
        byMonth,
        rawData: leads,
      };
    },
  });
}

export function useFinancialReport(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['financial-report', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('*, expense_categories(name), payment_methods(name)')
        .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
        .lte('transaction_date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      const receitas = transactions
        .filter(t => t.type === 'receita' && t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const despesas = transactions
        .filter(t => t.type === 'despesa' && t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // By category
      const byCategory = transactions.reduce((acc, t) => {
        const categoryName = t.expense_categories?.name || 'Sem categoria';
        if (!acc[categoryName]) {
          acc[categoryName] = { receitas: 0, despesas: 0 };
        }
        if (t.status === 'paid') {
          if (t.type === 'receita') {
            acc[categoryName].receitas += Number(t.amount);
          } else {
            acc[categoryName].despesas += Number(t.amount);
          }
        }
        return acc;
      }, {} as Record<string, { receitas: number; despesas: number }>);

      // By payment method
      const byPaymentMethod = transactions.reduce((acc, t) => {
        const method = t.payment_methods?.name || 'Não informado';
        acc[method] = (acc[method] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

      // Monthly evolution
      const byMonth = transactions.reduce((acc, t) => {
        const month = format(new Date(t.transaction_date), 'MMM/yyyy');
        if (!acc[month]) {
          acc[month] = { receitas: 0, despesas: 0 };
        }
        if (t.status === 'paid') {
          if (t.type === 'receita') {
            acc[month].receitas += Number(t.amount);
          } else {
            acc[month].despesas += Number(t.amount);
          }
        }
        return acc;
      }, {} as Record<string, { receitas: number; despesas: number }>);

      return {
        receitas,
        despesas,
        lucro: receitas - despesas,
        byCategory,
        byPaymentMethod,
        byMonth,
        rawData: transactions,
      };
    },
  });
}

export function useAppointmentsReport(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['appointments-report', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*, procedures(name), patients(name), leads(name)')
        .gte('appointment_date', format(startDate, 'yyyy-MM-dd'))
        .lte('appointment_date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      const total = appointments.length;
      const completed = appointments.filter(a => a.status === 'completed').length;
      const cancelled = appointments.filter(a => a.status === 'cancelled').length;

      // By procedure
      const byProcedure = appointments.reduce((acc, apt) => {
        const procedureName = apt.procedures?.name || 'Sem procedimento';
        acc[procedureName] = (acc[procedureName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // By status
      const byStatus = appointments.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // By hour (peak times)
      const byHour = appointments.reduce((acc, apt) => {
        const hour = new Date(apt.appointment_date).getHours();
        acc[`${hour}:00`] = (acc[`${hour}:00`] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total,
        completed,
        cancelled,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        byProcedure,
        byStatus,
        byHour,
        rawData: appointments,
      };
    },
  });
}
