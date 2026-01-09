import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
  evolution_instance?: string | null;
  active?: boolean | null;
  settings?: Record<string, unknown> | null;
}

interface AdminUserOrganization {
  organization_id: string;
  organization_name?: string | null;
  role: string;
  active: boolean;
}

interface AdminUser {
  id: string;
  email: string | null;
  full_name?: string | null;
  role?: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  organizations: AdminUserOrganization[];
}

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

interface SuperAdminContextType {
  isSuperAdmin: boolean;
  isLoading: boolean;
  organizations: Organization[];
  users: AdminUser[];
  loadOrganizations: () => Promise<void>;
  createOrganization: (data: Record<string, unknown>) => Promise<void>;
  updateOrganization: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  getOrganizationMembers: (orgId: string) => Promise<any[]>;
  addMember: (orgId: string, email: string, role: string) => Promise<void>;
  removeMember: (orgId: string, userId: string) => Promise<void>;
  updateMember: (orgId: string, userId: string, data: { role: string; active: boolean }) => Promise<void>;
  loadUsers: () => Promise<void>;
  resetUserPassword: (userId: string) => Promise<string | null>;
  setUserBlocked: (userId: string, blocked: boolean) => Promise<void>;
  auditLogs: AuditLog[];
  globalStats: GlobalStats;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

const getFunctionsBaseUrl = () => {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
};

export function SuperAdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
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

    if (user.email?.toLowerCase() !== 'leodeoliveira93@gmail.com') {
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na operação');
    }

    return response.json();
  };

  const callAdminUsersFunction = async (path: string, method: string, body?: Record<string, unknown>) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const response = await fetch(`${getFunctionsBaseUrl()}/admin-manage-users${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na operação');
    }

    return response.json();
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

  const createOrganization = async (data: Record<string, unknown>) => {
    await callAdminFunction('', 'POST', data);
    await loadOrganizations();
  };

  const updateOrganization = async (id: string, data: Record<string, unknown>) => {
    await callAdminFunction(`/${id}`, 'PUT', data);
    await loadOrganizations();
  };

  const deleteOrganization = async (id: string) => {
    await callAdminFunction(`/${id}`, 'DELETE');
    await loadOrganizations();
  };

  const getOrganizationMembers = async (orgId: string) => {
    const result = await callAdminFunction(`/${orgId}/members`, 'GET');
    return result.members || [];
  };

  const addMember = async (orgId: string, email: string, role: string) => {
    await callAdminFunction(`/${orgId}/members`, 'POST', { email, role });
    await loadUsers();
  };

  const removeMember = async (orgId: string, userId: string) => {
    await callAdminFunction(`/${orgId}/members/${userId}`, 'DELETE');
    await loadUsers();
  };

  const updateMember = async (orgId: string, userId: string, data: { role: string; active: boolean }) => {
    await callAdminFunction(`/${orgId}/members/${userId}`, 'PUT', data);
    await loadUsers();
  };

  const loadUsers = async () => {
    const result = await callAdminUsersFunction('', 'GET');
    setUsers(result.users || []);
  };

  const resetUserPassword = async (userId: string) => {
    const result = await callAdminUsersFunction(`/${userId}/reset-password`, 'POST');
    return result.action_link || null;
  };

  const setUserBlocked = async (userId: string, blocked: boolean) => {
    await callAdminUsersFunction(`/${userId}/block`, 'PUT', { blocked });
    await loadUsers();
  };

  useEffect(() => {
    fetchIsSuperAdmin();
  }, [user]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadOrganizations();
      loadAuditLogs();
      loadUsers();
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
        users,
        loadOrganizations,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        getOrganizationMembers,
        addMember,
        removeMember,
        updateMember,
        loadUsers,
        resetUserPassword,
        setUserBlocked,
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
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
}
