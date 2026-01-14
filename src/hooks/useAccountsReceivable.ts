import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface AccountsReceivableItem {
  id: string;
  amount: number;
  description: string | null;
  due_date: string | null;
  status: string;
  patient_id: string | null;
  quote_id: string | null;
  patients?: { name: string };
  quotes?: { quote_number: string; final_amount: number };
}

export interface ReceivableGroups {
  overdue: AccountsReceivableItem[];
  today: AccountsReceivableItem[];
  next7Days: AccountsReceivableItem[];
  next30Days: AccountsReceivableItem[];
  noDueDate: AccountsReceivableItem[];
}

export function useAccountsReceivable() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['accounts-receivable', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) {
        return {
          items: [],
          grouped: { overdue: [], today: [], next7Days: [], next30Days: [], noDueDate: [] },
        };
      }

      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          patients(name),
          quotes(quote_number, final_amount)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('type', 'receita')
        .in('status', ['pending', 'partial', 'overdue'])
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      const items = (data || []) as AccountsReceivableItem[];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const grouped = items.reduce<ReceivableGroups>(
        (acc, item) => {
          if (!item.due_date) {
            acc.noDueDate.push(item);
            return acc;
          }

          const dueDate = new Date(item.due_date);
          dueDate.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            acc.overdue.push(item);
          } else if (diffDays === 0) {
            acc.today.push(item);
          } else if (diffDays <= 7) {
            acc.next7Days.push(item);
          } else if (diffDays <= 30) {
            acc.next30Days.push(item);
          } else {
            acc.next30Days.push(item);
          }

          return acc;
        },
        { overdue: [], today: [], next7Days: [], next30Days: [], noDueDate: [] }
      );

      return { items, grouped };
    },
  });
}
