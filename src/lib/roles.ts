import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];

export const appRoles: AppRole[] = [
  'admin',
  'gerente',
  'comercial',
  'recepcao',
  'dentista',
  'usuario',
];

export const roleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  comercial: 'Comercial',
  recepcao: 'Recepção',
  dentista: 'Dentista',
  usuario: 'Usuário',
};

const roleAliases: Record<string, AppRole> = {
  admin: 'admin',
  administrador: 'admin',
  gerente: 'gerente',
  manager: 'gerente',
  comercial: 'comercial',
  sales: 'comercial',
  recepcao: 'recepcao',
  recepção: 'recepcao',
  reception: 'recepcao',
  receptionist: 'recepcao',
  dentista: 'dentista',
  dentist: 'dentista',
  usuario: 'usuario',
  user: 'usuario',
};

export const roleBadgeVariants: Record<
  AppRole,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  admin: 'destructive',
  gerente: 'default',
  comercial: 'secondary',
  recepcao: 'secondary',
  dentista: 'outline',
  usuario: 'secondary',
};

export const getRoleLabel = (role: AppRole | string) => {
  if (role in roleLabels) {
    return roleLabels[role as AppRole];
  }
  return 'Usuário';
};

export const normalizeRole = (role?: string | null): AppRole | null => {
  if (!role) return null;
  if (appRoles.includes(role as AppRole)) {
    return role as AppRole;
  }
  const normalized = role.toLowerCase();
  return roleAliases[normalized] ?? null;
};
