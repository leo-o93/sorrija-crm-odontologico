import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Organization } from '@/types/organization';
import type { AppRole } from '@/lib/roles';
import { safeJson } from '@/lib/http';

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface GlobalStats {
  organizations: number;
  users: number;
  leads: number;
  messages: number;
  activeOrganizations: number;
  inactiveOrganizations: number;
}

interface CreateOrgResult {
  organization: Organization;
  adminCreated?: {
    userId: string;
    email: string;
    fullName: string;
  };
  adminError?: string;
}

interface SuperAdminContextType {
  isSuperAdmin: boolean;
  isLoading: boolean;
  organizations: Organization[];
  loadOrganizations: () => Promise<void>;
  createOrganization: (data: Record<string, unknown>) => Promise<CreateOrgResult | null>;
  updateOrganization: (id: string, data: Record<string, unknown>) => Promise<boolean>;
  deleteOrganization: (id: string) => Promise<boolean>;
  getOrganizationMembers: (orgId: string) => Promise<any[]>;
  addMember: (orgId: string, email: string, role: AppRole) => Promise<boolean>;
  removeMember: (orgId: string, userId: string) => Promise<boolean>;
  auditLogs: AuditLog[];
  globalStats: GlobalStats;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

const getFunctionsBaseUrl = () => {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
};

export function SuperAdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get user directly from supabase to avoid circular dependency with AuthContext
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    organizations: 0,
    users: 0,
    leads: 0,
    messages: 0,
    activeOrganizations: 0,
    inactiveOrganizations: 0,
  });

  const fetchIsSuperAdmin = async () => {
    if (!user) {
      setIsSuperAdmin(false);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase.rpc('is_super_admin');
    setIsSuperAdmin(!!data);
    setIsLoading(false);
  };

  const callAdminFunction = async (path: string, method: string, body?: Record<string, unknown>) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const response = await fetch(`${getFunctionsBaseUrl()}/admin-manage-organizations${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await safeJson(response);

    if (!response.ok) {
      const errorMessage =
        (payload && typeof payload === 'object' && 'error' in payload && payload.error) ||
        'Erro na operação';
      throw new Error(String(errorMessage));
    }

    return payload;
  };

  const loadOrganizations = async () => {
    const result = await callAdminFunction('', 'GET');
    setOrganizations(result.organizations || []);
  };

  const loadAuditLogs = async () => {
    const { data } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    setAuditLogs((data || []) as AuditLog[]);
  };

  const loadGlobalStats = async () => {
    const [{ count: orgCount }, { count: usersCount }, { count: leadsCount }, { count: messagesCount }] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
    ]);

    const activeOrganizations = organizations.filter((org) => org.active).length;
    const inactiveOrganizations = organizations.filter((org) => !org.active).length;

    setGlobalStats({
      organizations: orgCount || 0,
      users: usersCount || 0,
      leads: leadsCount || 0,
      messages: messagesCount || 0,
      activeOrganizations,
      inactiveOrganizations,
    });
  };

  const createOrganization = async (data: Record<string, unknown>): Promise<CreateOrgResult | null> => {
    try {
      const result = await callAdminFunction('', 'POST', data);
      await loadOrganizations();
      return result as CreateOrgResult;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  const updateOrganization = async (id: string, data: Record<string, unknown>): Promise<boolean> => {
    try {
      await callAdminFunction(`/${id}`, 'PUT', data);
      await loadOrganizations();
      return true;
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  };

  const deleteOrganization = async (id: string): Promise<boolean> => {
    try {
      await callAdminFunction(`/${id}`, 'DELETE');
      await loadOrganizations();
      return true;
    } catch (error) {
      console.error('Error deleting organization:', error);
      throw error;
    }
  };

  const getOrganizationMembers = async (orgId: string) => {
    try {
      const result = await callAdminFunction(`/${orgId}/members`, 'GET');
      return result.members || [];
    } catch (error) {
      console.error('Error getting organization members:', error);
      throw error;
    }
  };

  const addMember = async (orgId: string, email: string, role: AppRole): Promise<boolean> => {
    try {
      await callAdminFunction(`/${orgId}/members`, 'POST', { email, role });
      return true;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  };

  const removeMember = async (orgId: string, userId: string): Promise<boolean> => {
    try {
      await callAdminFunction(`/${orgId}/members/${userId}`, 'DELETE');
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchIsSuperAdmin();
  }, [user]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadOrganizations();
      loadAuditLogs();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadGlobalStats();
    }
  }, [isSuperAdmin, organizations.length]);

  return (
    <SuperAdminContext.Provider
      value={{
        isSuperAdmin,
        isLoading,
        organizations,
        loadOrganizations,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        getOrganizationMembers,
        addMember,
        removeMember,
        auditLogs,
        globalStats,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);
  if (!context) {
    // Return safe defaults when outside provider (e.g., during hot reload)
    return {
      isSuperAdmin: false,
      isLoading: true,
      organizations: [],
      loadOrganizations: async () => {},
      createOrganization: async () => null,
      updateOrganization: async () => false,
      deleteOrganization: async () => false,
      getOrganizationMembers: async () => [],
      addMember: async () => false,
      removeMember: async () => false,
      auditLogs: [],
      globalStats: {
        organizations: 0,
        users: 0,
        leads: 0,
        messages: 0,
        activeOrganizations: 0,
        inactiveOrganizations: 0,
      },
    };
  }
  return context;
}
