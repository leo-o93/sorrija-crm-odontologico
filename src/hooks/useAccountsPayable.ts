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

export function useAccountsPayable() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['accounts-payable', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          suppliers(name),
          expense_categories(name)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('type', 'despesa')
        .in('status', ['pending', 'scheduled'])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as AccountsPayableItem[];
    },
  });
}
