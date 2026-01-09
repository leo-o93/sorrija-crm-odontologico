import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface Supplier {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: string | null;
  payment_terms: string | null;
  notes: string | null;
  active: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export function useSuppliers(filters?: { category?: string; active?: boolean; search?: string }) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['suppliers', currentOrganization?.id, filters],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name', { ascending: true });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Supplier[];
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: Partial<Supplier>) => {
      if (!currentOrganization?.id) throw new Error('No organization selected');

      const { data, error } = await supabase
        .from('suppliers')
        .insert([
          {
            ...input,
            organization_id: currentOrganization.id,
          } as Supplier,
        ])
        .select()
        .single();

      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor criado com sucesso');
    },
    onError: (error) => {
      console.error('Error creating supplier:', error);
      toast.error('Erro ao criar fornecedor');
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Error updating supplier:', error);
      toast.error('Erro ao atualizar fornecedor');
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor removido com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting supplier:', error);
      toast.error('Erro ao remover fornecedor');
    },
  });
}
