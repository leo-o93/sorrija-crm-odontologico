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
