import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Organization {
  id: string;
  evolution_instance: string;
  name: string;
  settings: any;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  isLoading: boolean;
  refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshOrganization = async () => {
    if (!user) {
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Buscar memberships do usuário
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('active', true);

      if (memberError) throw memberError;

      // Se não tem membership, tentar criar organização baseado na integration_settings
      if (!memberships || memberships.length === 0) {
        const { data: settings } = await supabase
          .from('integration_settings')
          .select('settings')
          .eq('integration_type', 'whatsapp_evolution')
          .eq('active', true)
          .single();

        const evolutionInstance = settings?.settings && typeof settings.settings === 'object' 
          ? (settings.settings as any).evolution_instance 
          : null;

        if (evolutionInstance) {
          // Criar organização para essa instância
          const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({
              evolution_instance: evolutionInstance,
              name: `Organização ${evolutionInstance}`,
            })
            .select()
            .single();

          if (orgError) {
            // Se já existe, buscar
            const { data: existingOrg } = await supabase
              .from('organizations')
              .select('*')
              .eq('evolution_instance', evolutionInstance)
              .single();

            if (existingOrg) {
              // Adicionar usuário como membro
              await supabase.from('organization_members').insert({
                organization_id: existingOrg.id,
                user_id: user.id,
              });
              setCurrentOrganization(existingOrg);
            }
          } else if (newOrg) {
            // Adicionar usuário como membro
            await supabase.from('organization_members').insert({
              organization_id: newOrg.id,
              user_id: user.id,
            });
            setCurrentOrganization(newOrg);
          }
        }
      } else {
        // Buscar organização ativa do primeiro membership
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', memberships[0].organization_id)
          .eq('active', true)
          .single();

        if (orgError) throw orgError;
        setCurrentOrganization(org);
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshOrganization();
  }, [user]);

  // Monitorar mudanças em integration_settings
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('integration-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integration_settings',
          filter: `integration_type=eq.whatsapp_evolution`,
        },
        () => {
          refreshOrganization();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        isLoading,
        refreshOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
