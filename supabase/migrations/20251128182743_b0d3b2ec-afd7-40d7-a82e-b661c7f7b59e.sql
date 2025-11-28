-- Fase 1: Adicionar organization_id à tabela integration_settings e limpar duplicatas

-- 1.1 Adicionar coluna organization_id (nullable inicialmente)
ALTER TABLE public.integration_settings 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 1.2 Popular organization_id para registros existentes
-- Associar todos os registros existentes à primeira organização
UPDATE public.integration_settings
SET organization_id = (
  SELECT id FROM public.organizations 
  ORDER BY created_at ASC 
  LIMIT 1
)
WHERE organization_id IS NULL;

-- 1.3 Remover registros duplicados ANTES de criar constraint
-- (manter apenas o mais recente por organização/tipo)
DELETE FROM public.integration_settings a
USING public.integration_settings b
WHERE a.id < b.id
  AND a.organization_id = b.organization_id
  AND a.integration_type = b.integration_type;

-- 1.4 Agora podemos criar a constraint única
ALTER TABLE public.integration_settings 
ADD CONSTRAINT unique_org_integration_type 
UNIQUE (organization_id, integration_type);

-- 1.5 Tornar organization_id obrigatório
ALTER TABLE public.integration_settings 
ALTER COLUMN organization_id SET NOT NULL;

-- 1.6 Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_integration_settings_org_type 
ON public.integration_settings(organization_id, integration_type);

-- 1.7 Atualizar RLS policies para integration_settings
DROP POLICY IF EXISTS "Admin can manage integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Admin can view integration settings" ON public.integration_settings;

-- Política para visualizar configurações da organização
CREATE POLICY "Users can view integration settings for their organizations"
ON public.integration_settings
FOR SELECT
USING (
  organization_id IN (SELECT get_user_organization_ids())
);

-- Política para gerenciar configurações (apenas admins e gerentes)
CREATE POLICY "Admins can manage integration settings for their organizations"
ON public.integration_settings
FOR ALL
USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
)
WITH CHECK (
  organization_id IN (SELECT get_user_organization_ids())
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
);