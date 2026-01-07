
-- 1. Tabela de configurações do CRM
CREATE TABLE crm_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Configurações de temperatura automática
  hot_to_cold_days integer DEFAULT 3,
  hot_to_cold_hours integer DEFAULT 0,
  enable_auto_temperature boolean DEFAULT true,
  
  -- Configurações de substatus quente
  awaiting_response_minutes integer DEFAULT 60,
  enable_auto_substatus boolean DEFAULT true,
  
  -- Configurações de follow-up
  max_follow_up_attempts integer DEFAULT 5,
  default_follow_up_interval integer DEFAULT 3,
  
  -- Configurações de automação
  enable_automation boolean DEFAULT false,
  automation_mode text DEFAULT 'manual' CHECK (automation_mode IN ('manual', 'semi_auto', 'full_auto')),
  use_ai_for_unmatched boolean DEFAULT false,
  
  -- Notificações
  enable_follow_up_alerts boolean DEFAULT true,
  enable_cold_lead_alerts boolean DEFAULT true,
  enable_no_show_alerts boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id)
);

-- 2. Tabela de temperaturas configuráveis
CREATE TABLE lead_temperatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text NOT NULL,
  color text NOT NULL DEFAULT 'bg-blue-500',
  icon text NOT NULL DEFAULT 'thermometer',
  position integer DEFAULT 0,
  is_default boolean DEFAULT false,
  is_system boolean DEFAULT false,
  auto_transition_to uuid REFERENCES lead_temperatures(id),
  auto_transition_days integer,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. Tabela de gatilhos de interesse
CREATE TABLE interest_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  priority integer DEFAULT 0,
  
  -- Condições
  condition_field text NOT NULL CHECK (condition_field IN ('first_message', 'any_message', 'push_name', 'source_name')),
  condition_operator text NOT NULL CHECK (condition_operator IN ('contains', 'not_contains', 'equals', 'not_equals', 'starts_with', 'ends_with', 'regex', 'is_empty', 'is_not_empty')),
  condition_value text NOT NULL DEFAULT '',
  case_sensitive boolean DEFAULT false,
  
  -- Ações
  action_set_interest_id uuid REFERENCES procedures(id),
  action_set_source_id uuid REFERENCES sources(id),
  action_set_temperature text,
  action_set_status text,
  
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. Tabela de templates de mensagem
CREATE TABLE message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('welcome', 'follow_up', 'reminder', 'no_show', 'reactivation', 'quote')),
  interest_id uuid REFERENCES procedures(id),
  temperature text,
  attempt_number integer,
  content text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 5. Tabela de sugestões da IA
CREATE TABLE ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  suggestion_type text NOT NULL CHECK (suggestion_type IN ('temperature_change', 'send_message', 'schedule', 'follow_up', 'convert_patient')),
  suggestion_data jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- 6. Adicionar colunas na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS temperature text DEFAULT 'novo';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS hot_substatus text DEFAULT 'em_conversa' CHECK (hot_substatus IN ('em_conversa', 'aguardando_resposta', 'em_negociacao', 'follow_up_agendado'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up_date date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_count integer DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_follow_up_date date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS no_show_count integer DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS triggered_by uuid REFERENCES interest_triggers(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS automation_enabled boolean DEFAULT true;

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads(organization_id, temperature);
CREATE INDEX IF NOT EXISTS idx_leads_hot_substatus ON leads(organization_id, hot_substatus) WHERE temperature = 'quente';
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(organization_id, next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_interaction ON leads(organization_id, last_interaction_at);
CREATE INDEX IF NOT EXISTS idx_interest_triggers_org ON interest_triggers(organization_id, priority) WHERE active = true;

-- 8. RLS para crm_settings
ALTER TABLE crm_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view CRM settings from their organization"
ON crm_settings FOR SELECT
USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Admins can manage CRM settings in their organization"
ON crm_settings FOR ALL
USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
);

-- 9. RLS para lead_temperatures
ALTER TABLE lead_temperatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead temperatures from their organization"
ON lead_temperatures FOR SELECT
USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Admins can manage lead temperatures in their organization"
ON lead_temperatures FOR ALL
USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
);

-- 10. RLS para interest_triggers
ALTER TABLE interest_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interest triggers from their organization"
ON interest_triggers FOR SELECT
USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Admins can manage interest triggers in their organization"
ON interest_triggers FOR ALL
USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
);

-- 11. RLS para message_templates
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view message templates from their organization"
ON message_templates FOR SELECT
USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Admins can manage message templates in their organization"
ON message_templates FOR ALL
USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
);

-- 12. RLS para ai_suggestions
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI suggestions from their organization"
ON ai_suggestions FOR SELECT
USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Staff can manage AI suggestions in their organization"
ON ai_suggestions FOR ALL
USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'comercial'))
);

-- 13. Trigger para updated_at em crm_settings
CREATE TRIGGER update_crm_settings_updated_at
BEFORE UPDATE ON crm_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
