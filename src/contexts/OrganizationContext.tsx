// OrganizationContext - provides organization context for the entire app
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

      // Verificar se é Super Admin
      const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');

      if (isSuperAdmin) {
        // Super Admin vê TODAS as organizações ativas
        const { data: allOrgs, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .eq('active', true)
          .order('name');

        if (orgsError) throw orgsError;

        setAvailableOrganizations(allOrgs || []);

        // Usar organização salva em localStorage ou primeira disponível
        const savedOrgId = localStorage.getItem('currentOrganizationId');
        const selectedOrg = savedOrgId 
          ? (allOrgs || []).find(o => o.id === savedOrgId) 
          : (allOrgs || [])[0];

        setCurrentOrganization(selectedOrg || (allOrgs || [])[0]);
      } else {
        // Buscar memberships do usuário (lógica normal)
        const { data: memberships, error: memberError } = await supabase
          .from('organization_members')
          .select('organization_id, organizations(*)')
          .eq('user_id', user.id)
          .eq('active', true);

        if (memberError) throw memberError;

        // Se não tem membership, aguardar onboarding manual
        if (!memberships || memberships.length === 0) {
          setAvailableOrganizations([]);
          setCurrentOrganization(null);
          toast.error('Nenhuma organização vinculada ao seu usuário.');
          toast.message('Solicite ao administrador o acesso ou crie uma organização.');
        } else {
          // Extrair organizações dos memberships
          const orgs = memberships
            .map(m => m.organizations as Organization | null)
            .filter((org): org is Organization => org !== null && org.active === true);

          setAvailableOrganizations(orgs);

          const { data: preferenceData } = await supabase
            .from('user_preferences' as any)
            .select('last_organization_id')
            .eq('user_id', user.id)
            .maybeSingle();

          // Usar organização salva em localStorage, preferência no backend ou primeira disponível
          const savedOrgId = localStorage.getItem('currentOrganizationId');
          const preferredOrgId = preferenceData?.last_organization_id ?? null;

          const selectedOrg = savedOrgId
            ? orgs.find(o => o.id === savedOrgId)
            : preferredOrgId
              ? orgs.find(o => o.id === preferredOrgId)
              : orgs[0];

          setCurrentOrganization(selectedOrg || orgs[0]);
        }
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
      if (user) {
        await supabase.from('user_preferences' as any).upsert({
          user_id: user.id,
          last_organization_id: organizationId,
        });
      }
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
