-- Parte 1: Atualizar get_user_organization_ids() para incluir Super Admins
CREATE OR REPLACE FUNCTION public.get_user_organization_ids(_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Se for Super Admin, retorna TODAS as organizações
  SELECT o.id 
  FROM organizations o
  WHERE EXISTS (SELECT 1 FROM super_admins WHERE user_id = _user_id)
  
  UNION
  
  -- Caso contrário, retorna apenas as organizações onde é membro ativo
  SELECT om.organization_id 
  FROM organization_members om
  WHERE om.user_id = _user_id AND om.active = true;
$$;

-- Parte 2: Recriar políticas RLS de integration_settings com auth.uid() explícito
DROP POLICY IF EXISTS "Members can view integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Members can insert integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Members can update integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Members can delete integration settings" ON public.integration_settings;

CREATE POLICY "Members can view integration settings"
ON public.integration_settings FOR SELECT
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Members can insert integration settings"
ON public.integration_settings FOR INSERT
WITH CHECK (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Members can update integration settings"
ON public.integration_settings FOR UPDATE
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())))
WITH CHECK (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Members can delete integration settings"
ON public.integration_settings FOR DELETE
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));