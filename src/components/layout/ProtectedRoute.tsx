import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAutoLeadTransitions } from '@/hooks/useAutoLeadTransitions';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import type { AppRole } from '@/lib/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole | AppRole[];
  superAdminOnly?: boolean;
}

export function ProtectedRoute({ children, requiredRole, superAdminOnly = false }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const { isLoading: isLoadingOrg } = useOrganization();
  const { isSuperAdmin, isLoading: isLoadingSuperAdmin } = useSuperAdmin();
  
  // Run auto-lead-transitions every 5 minutes while user is authenticated
  useAutoLeadTransitions({ intervalMinutes: 5 });

  // Show loading while authentication, organization, or super admin check is loading
  if (loading || isLoadingOrg || isLoadingSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {loading ? 'Carregando...' : isLoadingOrg ? 'Carregando organização...' : 'Verificando permissões...'}
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Super Admin always has full access (except when superAdminOnly is explicitly for super admins)
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // If this route is for Super Admin only, deny access to non-super admins
  if (superAdminOnly) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Esta página é exclusiva para Super Administradores.
          </p>
        </div>
      </div>
    );
  }

  // Check role-based access for regular users
  const requiredRoles = requiredRole
    ? Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole]
    : [];

  // Admin role from organization_members has access to everything except /admin (which is superAdminOnly)
  if (userRole?.role === 'admin') {
    return <>{children}</>;
  }

  // Check if user has required role
  if (requiredRoles.length > 0 && !(userRole?.role && requiredRoles.includes(userRole.role))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
