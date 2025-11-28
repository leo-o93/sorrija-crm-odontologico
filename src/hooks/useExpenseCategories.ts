import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface ExpenseCategory {
  id: string;
  name: string;
  type: 'receita' | 'despesa';
  color: string | null;
  icon: string | null;
  active: boolean;
  created_at: string;
}

export function useExpenseCategories(type?: 'receita' | 'despesa') {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['expense-categories', currentOrganization?.id, type],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from('expense_categories')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('active', true)
        .order('name');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ExpenseCategory[];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (category: Partial<ExpenseCategory>) => {
      if (!currentOrganization?.id) throw new Error("No organization selected");
      
      const { data, error } = await supabase
        .from('expense_categories')
        .insert([{
          ...category,
          organization_id: currentOrganization.id
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast.success('Categoria criada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating category:', error);
      toast.error('Erro ao criar categoria');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ExpenseCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('expense_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast.success('Categoria atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast.error('Erro ao atualizar categoria');
    },
  });
}
