import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface AccountsPayableItem {
  id: string;
  amount: number;
  description: string | null;
  due_date: string | null;
  status: string;
  supplier_id: string | null;
  expense_categories?: { name: string };
  suppliers?: { name: string };
}

export interface PayableGroups {
  overdue: AccountsPayableItem[];
  today: AccountsPayableItem[];
  next7Days: AccountsPayableItem[];
  next30Days: AccountsPayableItem[];
  noDueDate: AccountsPayableItem[];
}

export function useAccountsPayable() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['accounts-payable', currentOrganization?.id],
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
          suppliers(name),
          expense_categories(name)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('type', 'despesa')
        .in('status', ['pending', 'scheduled', 'overdue'])
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      const items = (data || []) as AccountsPayableItem[];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const grouped = items.reduce<PayableGroups>(
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
