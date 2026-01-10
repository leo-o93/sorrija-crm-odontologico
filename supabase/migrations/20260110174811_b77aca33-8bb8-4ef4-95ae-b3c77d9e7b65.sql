-- Criar função auxiliar para verificar role na organização específica
CREATE OR REPLACE FUNCTION public.has_org_role(
  org_id uuid, 
  required_role app_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND active = true
      AND role = required_role
  );
$$;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins can manage integration settings for their organizations" 
  ON public.integration_settings;
DROP POLICY IF EXISTS "Admins can view integration settings" 
  ON public.integration_settings;

-- Nova política de visualização
CREATE POLICY "Users can view integration settings for their organizations"
ON public.integration_settings
FOR SELECT
USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND (
    has_org_role(organization_id, 'admin'::app_role) OR 
    has_org_role(organization_id, 'gerente'::app_role)
  )
);

-- Nova política de gerenciamento
CREATE POLICY "Admins can manage integration settings for their organizations"
ON public.integration_settings
FOR ALL
USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND (
    has_org_role(organization_id, 'admin'::app_role) OR 
    has_org_role(organization_id, 'gerente'::app_role)
  )
)
WITH CHECK (
  organization_id IN (SELECT get_user_organization_ids())
  AND (
    has_org_role(organization_id, 'admin'::app_role) OR 
    has_org_role(organization_id, 'gerente'::app_role)
  )
);