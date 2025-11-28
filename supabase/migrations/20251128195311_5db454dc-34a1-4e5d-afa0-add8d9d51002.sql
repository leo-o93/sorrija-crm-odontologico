-- =====================================================
-- MIGRATION: Fix Security RLS Policies
-- Corrige políticas RLS inseguras identificadas na auditoria de segurança
-- =====================================================

-- 1. QUOTE_ITEMS - Remover políticas inseguras que usam 'true'
DROP POLICY IF EXISTS "Permitir leitura de itens de orçamento" ON quote_items;
DROP POLICY IF EXISTS "Permitir criação de itens de orçamento" ON quote_items;
DROP POLICY IF EXISTS "Permitir atualização de itens de orçamento" ON quote_items;
DROP POLICY IF EXISTS "Permitir exclusão de itens de orçamento" ON quote_items;

-- 1. QUOTE_ITEMS - Criar políticas seguras baseadas em organização
CREATE POLICY "Users can view quote items in their org" ON quote_items
FOR SELECT USING (
  quote_id IN (SELECT id FROM quotes WHERE organization_id IN (SELECT get_user_organization_ids()))
);

CREATE POLICY "Users can manage quote items in their org" ON quote_items
FOR ALL USING (
  quote_id IN (SELECT id FROM quotes WHERE organization_id IN (SELECT get_user_organization_ids()))
) WITH CHECK (
  quote_id IN (SELECT id FROM quotes WHERE organization_id IN (SELECT get_user_organization_ids()))
);

-- 2. QUOTE_PAYMENTS - Remover políticas inseguras que usam 'true'
DROP POLICY IF EXISTS "Permitir leitura de pagamentos de orçamento" ON quote_payments;
DROP POLICY IF EXISTS "Permitir criação de pagamentos de orçamento" ON quote_payments;
DROP POLICY IF EXISTS "Permitir atualização de pagamentos de orçamento" ON quote_payments;
DROP POLICY IF EXISTS "Permitir exclusão de pagamentos de orçamento" ON quote_payments;

-- 2. QUOTE_PAYMENTS - Criar políticas seguras baseadas em organização
CREATE POLICY "Users can view quote payments in their org" ON quote_payments
FOR SELECT USING (
  quote_id IN (SELECT id FROM quotes WHERE organization_id IN (SELECT get_user_organization_ids()))
);

CREATE POLICY "Users can manage quote payments in their org" ON quote_payments
FOR ALL USING (
  quote_id IN (SELECT id FROM quotes WHERE organization_id IN (SELECT get_user_organization_ids()))
) WITH CHECK (
  quote_id IN (SELECT id FROM quotes WHERE organization_id IN (SELECT get_user_organization_ids()))
);

-- 3. PROFILES - Remover política que permite acesso global
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON profiles;

-- 3. PROFILES - Criar política que restringe visualização à organização
CREATE POLICY "Users can view profiles in their organization" ON profiles
FOR SELECT USING (
  id = auth.uid() OR
  id IN (
    SELECT user_id FROM organization_members 
    WHERE organization_id IN (SELECT get_user_organization_ids())
  )
);

-- 4. USER_ROLES - Remover política que permite acesso global
DROP POLICY IF EXISTS "Anyone authenticated can view roles" ON user_roles;

-- 4. USER_ROLES - Criar política que restringe visualização à organização
CREATE POLICY "Users can view roles in their organization" ON user_roles
FOR SELECT USING (
  user_id = auth.uid() OR
  user_id IN (
    SELECT user_id FROM organization_members 
    WHERE organization_id IN (SELECT get_user_organization_ids())
  )
);

-- 5. LEAD_INTERACTIONS - Remover política que usa 'true'
DROP POLICY IF EXISTS "Staff can view lead interactions" ON lead_interactions;

-- 5. LEAD_INTERACTIONS - Criar política que filtra por organização via lead
CREATE POLICY "Staff can view lead interactions in their organization" ON lead_interactions
FOR SELECT USING (
  lead_id IN (
    SELECT id FROM leads WHERE organization_id IN (SELECT get_user_organization_ids())
  )
);

-- 6. INTEGRATION_SETTINGS - Remover política que permite acesso a todos os membros
DROP POLICY IF EXISTS "Users can view integration settings for their organizations" ON integration_settings;

-- 6. INTEGRATION_SETTINGS - Criar política restrita a admin/gerente
CREATE POLICY "Admins can view integration settings" ON integration_settings
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
);