-- Parte 1: Atualizar função has_operational_role para verificar organization_members e super_admins
CREATE OR REPLACE FUNCTION public.has_operational_role(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    -- Verifica se é Super Admin
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = _user_id
    )
    OR
    -- Verifica em organization_members (fonte primária)
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = _user_id
        AND active = true
        AND role IN ('admin', 'usuario')
    )
    OR
    -- Fallback para user_roles (compatibilidade legada)
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
        AND role IN ('admin', 'usuario')
    )
$function$;

-- Parte 2: Migrar roles legados para 'usuario' na tabela user_roles
UPDATE public.user_roles 
SET role = 'usuario'
WHERE role IN ('gerente', 'comercial', 'recepcao', 'dentista');

-- Parte 3: Migrar roles legados para 'usuario' na tabela organization_members
UPDATE public.organization_members 
SET role = 'usuario'
WHERE role IN ('gerente', 'comercial', 'recepcao', 'dentista');

-- Parte 4: Migrar roles legados para 'usuario' na tabela profiles (para consistência)
UPDATE public.profiles 
SET role = 'usuario'
WHERE role IN ('gerente', 'comercial', 'recepcao', 'dentista');