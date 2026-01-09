import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminSettings {
  id: string;
  support_email: string | null;
  default_timezone: string | null;
  allow_new_organizations: boolean | null;
}

export function useAdminSettings() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AdminSettings | null;
    },
  });

  const upsertSettings = useMutation({
    mutationFn: async (values: Partial<AdminSettings>) => {
      const existingId = settingsQuery.data?.id;
      const { data, error } = await supabase
        .from('admin_settings')
        .upsert({
          id: existingId,
          ...values,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AdminSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    upsertSettings,
  };
}
