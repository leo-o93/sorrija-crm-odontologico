import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Organization } from '@/types/organization';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  availableOrganizations: Organization[];
  isLoading: boolean;
  refreshOrganization: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrganizations = async () => {
    if (!user) {
      setCurrentOrganization(null);
      setAvailableOrganizations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Buscar memberships do usuário
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(*)')
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
              setAvailableOrganizations([existingOrg]);
            }
          } else if (newOrg) {
            // Adicionar usuário como membro
            await supabase.from('organization_members').insert({
              organization_id: newOrg.id,
              user_id: user.id,
            });
            setCurrentOrganization(newOrg);
            setAvailableOrganizations([newOrg]);
          }
        }
      } else {
        // Extrair organizações dos memberships
        const orgs = memberships
          .map(m => m.organizations as Organization | null)
          .filter((org): org is Organization => org !== null && org.active === true);

        setAvailableOrganizations(orgs);

        // Usar organização salva em localStorage ou primeira disponível
        const savedOrgId = localStorage.getItem('currentOrganizationId');
        const selectedOrg = savedOrgId 
          ? orgs.find(o => o.id === savedOrgId) 
          : orgs[0];

        setCurrentOrganization(selectedOrg || orgs[0]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast.error('Erro ao carregar organizações');
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrganization = async (organizationId: string) => {
    const org = availableOrganizations.find(o => o.id === organizationId);
    if (org) {
      setCurrentOrganization(org);
      localStorage.setItem('currentOrganizationId', organizationId);
      toast.success(`Organização alterada para ${org.name}`);
      
      // Invalidar todas as queries para recarregar dados da nova organização
      queryClient.invalidateQueries();
    }
  };

  const refreshOrganization = async () => {
    await loadOrganizations();
  };

  useEffect(() => {
    loadOrganizations();
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
        availableOrganizations,
        isLoading,
        refreshOrganization,
        switchOrganization,
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
