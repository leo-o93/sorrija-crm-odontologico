-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view integration settings for their organizations" 
  ON public.integration_settings;
DROP POLICY IF EXISTS "Admins can manage integration settings for their organizations" 
  ON public.integration_settings;

-- Política de visualização: qualquer membro da organização pode ver
CREATE POLICY "Members can view integration settings"
ON public.integration_settings
FOR SELECT
USING (
  organization_id IN (SELECT get_user_organization_ids())
);

-- Política de inserção: membros podem criar configurações para suas organizações
CREATE POLICY "Members can insert integration settings"
ON public.integration_settings
FOR INSERT
WITH CHECK (
  organization_id IN (SELECT get_user_organization_ids())
);

-- Política de atualização: membros podem atualizar
CREATE POLICY "Members can update integration settings"
ON public.integration_settings
FOR UPDATE
USING (
  organization_id IN (SELECT get_user_organization_ids())
)
WITH CHECK (
  organization_id IN (SELECT get_user_organization_ids())
);

-- Política de exclusão: membros podem excluir
CREATE POLICY "Members can delete integration settings"
ON public.integration_settings
FOR DELETE
USING (
  organization_id IN (SELECT get_user_organization_ids())
);