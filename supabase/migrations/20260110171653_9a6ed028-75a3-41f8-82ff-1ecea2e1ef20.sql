-- =====================================================
-- Migration: Update RLS Policies for 'usuario' role
-- This migration updates all operational table policies
-- to include the new 'usuario' role alongside 'admin'
-- =====================================================

-- Helper function to check if user has operational role (admin or usuario)
CREATE OR REPLACE FUNCTION public.has_operational_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'usuario')
  )
$$;

-- =====================================================
-- LEADS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Comercial can manage leads in their organization" ON leads;
DROP POLICY IF EXISTS "Users can manage leads in their organization" ON leads;

CREATE POLICY "Users can manage leads in their organization" ON leads
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);

-- =====================================================
-- CONVERSATIONS TABLE  
-- =====================================================
DROP POLICY IF EXISTS "Users can manage conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Staff can manage conversations in their organization" ON conversations;

CREATE POLICY "Users can manage conversations in their organization" ON conversations
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage messages in their organization" ON messages;
DROP POLICY IF EXISTS "Staff can manage messages in their organization" ON messages;

CREATE POLICY "Users can manage messages in their organization" ON messages
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Recepcao can manage appointments in their organization" ON appointments;
DROP POLICY IF EXISTS "Users can manage appointments in their organization" ON appointments;

CREATE POLICY "Users can manage appointments in their organization" ON appointments
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Recepcao can manage patients in their organization" ON patients;
DROP POLICY IF EXISTS "Users can manage patients in their organization" ON patients;

CREATE POLICY "Users can manage patients in their organization" ON patients
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);

-- =====================================================
-- AI_SUGGESTIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Comercial can manage ai_suggestions in their organization" ON ai_suggestions;
DROP POLICY IF EXISTS "Users can manage ai_suggestions in their organization" ON ai_suggestions;

CREATE POLICY "Users can manage ai_suggestions in their organization" ON ai_suggestions
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);

-- =====================================================
-- LEAD_INTERACTIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Comercial can manage lead_interactions" ON lead_interactions;
DROP POLICY IF EXISTS "Users can manage lead_interactions" ON lead_interactions;

CREATE POLICY "Users can manage lead_interactions" ON lead_interactions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM leads 
    WHERE leads.id = lead_interactions.lead_id 
    AND leads.organization_id IN (SELECT get_user_organization_ids())
  )
  AND has_operational_role(auth.uid())
);

-- =====================================================
-- QUOTES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage quotes in their organization" ON quotes;

CREATE POLICY "Users can manage quotes in their organization" ON quotes
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);

-- =====================================================
-- PROCEDURES TABLE (Cadastros)
-- =====================================================
DROP POLICY IF EXISTS "Users can view procedures in their organization" ON procedures;
DROP POLICY IF EXISTS "Users can manage procedures in their organization" ON procedures;

CREATE POLICY "Users can manage procedures in their organization" ON procedures
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);

-- =====================================================
-- SOURCES TABLE (Cadastros)
-- =====================================================
DROP POLICY IF EXISTS "Users can view sources in their organization" ON sources;
DROP POLICY IF EXISTS "Users can manage sources in their organization" ON sources;

CREATE POLICY "Users can manage sources in their organization" ON sources
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);

-- =====================================================
-- MESSAGE_TEMPLATES TABLE (Cadastros)
-- =====================================================
DROP POLICY IF EXISTS "Users can view message_templates in their organization" ON message_templates;
DROP POLICY IF EXISTS "Users can manage message_templates in their organization" ON message_templates;

CREATE POLICY "Users can manage message_templates in their organization" ON message_templates
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);

-- =====================================================
-- LEAD_STATUSES TABLE (Cadastros)
-- =====================================================
DROP POLICY IF EXISTS "Users can view lead_statuses in their organization" ON lead_statuses;
DROP POLICY IF EXISTS "Users can manage lead_statuses in their organization" ON lead_statuses;

CREATE POLICY "Users can manage lead_statuses in their organization" ON lead_statuses
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);

-- =====================================================
-- INTEREST_TRIGGERS TABLE (Cadastros)
-- =====================================================
DROP POLICY IF EXISTS "Users can view interest_triggers in their organization" ON interest_triggers;
DROP POLICY IF EXISTS "Users can manage interest_triggers in their organization" ON interest_triggers;

CREATE POLICY "Users can manage interest_triggers in their organization" ON interest_triggers
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND has_operational_role(auth.uid())
);