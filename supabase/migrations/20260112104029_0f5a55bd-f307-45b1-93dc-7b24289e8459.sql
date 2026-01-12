-- Correção 1: Remover constraint única global do nome de procedimentos
ALTER TABLE public.procedures
DROP CONSTRAINT IF EXISTS procedures_name_key;

-- Criar constraint composta (nome + organização)
ALTER TABLE public.procedures
ADD CONSTRAINT procedures_name_org_unique UNIQUE (name, organization_id);

-- Correção 2: Ajustar política RLS para temperature_transition_rules
DROP POLICY IF EXISTS "Users can manage temperature rules" ON temperature_transition_rules;

CREATE POLICY "Users can manage temperature rules"
ON temperature_transition_rules
FOR ALL
USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
)
WITH CHECK (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);