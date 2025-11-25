import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Organization {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  active: boolean;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role_in_org: string;
  is_owner: boolean;
  active: boolean;
  organizations?: Organization;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  membership: OrganizationMember | null;
  isOwner: boolean;
  isAdmin: boolean;
  loading: boolean;
  needsOnboarding: boolean;
  switchOrganization: (orgId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [membership, setMembership] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchOrganizations = async () => {
    if (!user) {
      setCurrentOrganization(null);
      setOrganizations([]);
      setMembership(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch user's organization memberships
      const { data: memberships, error } = await supabase
        .from('organization_members')
        .select('*, organizations!inner(*)')
        .eq('user_id', user.id)
        .eq('active', true);

      if (error) throw error;

      if (memberships && memberships.length > 0) {
        const orgs = memberships.map((m: any) => m.organizations);
        setOrganizations(orgs);
        setNeedsOnboarding(false);

        // Get saved organization from localStorage or use first
        const savedOrgId = localStorage.getItem('currentOrganizationId');
        const currentMembership = savedOrgId
          ? memberships.find((m: any) => m.organization_id === savedOrgId)
          : memberships[0];

        if (currentMembership) {
          setMembership(currentMembership as OrganizationMember);
          setCurrentOrganization((currentMembership as any).organizations);
        }
      } else {
        // User has no organizations - needs onboarding
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [user]);

  const switchOrganization = async (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      localStorage.setItem('currentOrganizationId', orgId);

      // Update membership
      const { data } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user?.id)
        .eq('organization_id', orgId)
        .single();

      if (data) {
        setMembership(data as OrganizationMember);
      }
    }
  };

  const isOwner = membership?.is_owner || false;
  const isAdmin = membership?.role_in_org === 'owner' || membership?.role_in_org === 'admin';

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        membership,
        isOwner,
        isAdmin,
        loading,
        needsOnboarding,
        switchOrganization,
        refetch: fetchOrganizations,
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
