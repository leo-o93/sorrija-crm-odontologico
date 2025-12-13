-- Fase 1: Adicionar coluna role em organization_members
ALTER TABLE public.organization_members 
ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'recepcao'::app_role;

-- Migrar roles existentes dos profiles para organization_members
UPDATE public.organization_members om
SET role = p.role
FROM public.profiles p
WHERE om.user_id = p.id;

-- Fase 5: Criar função has_role_in_org para verificar role por organização
CREATE OR REPLACE FUNCTION public.has_role_in_org(
  _user_id uuid, 
  _role app_role, 
  _org_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id 
      AND role = _role 
      AND organization_id = _org_id
      AND active = true
  )
$$;

-- Criar função para verificar se usuário é admin/gerente de uma organização
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id 
      AND organization_id = _org_id
      AND role IN ('admin', 'gerente')
      AND active = true
  )
$$;