-- Phase 2: Finance module tables and columns
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  category TEXT,
  payment_terms TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recurring_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category_id UUID REFERENCES expense_categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  start_date DATE NOT NULL,
  end_date DATE,
  next_due_date DATE NOT NULL,
  last_generated_date DATE,
  active BOOLEAN DEFAULT true,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(organization_id, active);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_org ON recurring_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_next_due ON recurring_payments(organization_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_due_date ON financial_transactions(organization_id, due_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type_date ON financial_transactions(organization_id, type, transaction_date);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suppliers from their organization" ON suppliers
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can manage suppliers in their organization" ON suppliers
  FOR ALL USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can view recurring payments from their organization" ON recurring_payments
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can manage recurring payments in their organization" ON recurring_payments
  FOR ALL USING (organization_id IN (SELECT get_user_organization_ids()));

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS recurring_payment_id UUID REFERENCES recurring_payments(id);

-- Phase 3: Realtime publication for webhooks
ALTER PUBLICATION supabase_realtime ADD TABLE webhooks;

-- Phase 4: Super admin structures
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

INSERT INTO super_admins (user_id) 
SELECT id FROM auth.users WHERE email = 'leodeoliveira93@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins WHERE user_id = auth.uid()
  )
$$;

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can view super_admins" ON super_admins
  FOR SELECT USING (is_super_admin());

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can view audit log" ON admin_audit_log
  FOR SELECT USING (is_super_admin());
CREATE POLICY "Super admins can insert audit log" ON admin_audit_log
  FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can view all organizations" ON organizations
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Super admins can manage all organizations" ON organizations
  FOR ALL USING (is_super_admin());

CREATE POLICY "Super admins can manage all memberships" ON organization_members
  FOR ALL USING (is_super_admin());

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON admin_audit_log(target_type, target_id);

-- Phase 5: Performance indexes
CREATE INDEX IF NOT EXISTS idx_leads_org_temp_status ON leads(organization_id, temperature, status);
CREATE INDEX IF NOT EXISTS idx_leads_org_created ON leads(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_org_last_interaction ON leads(organization_id, last_interaction_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_org_conv_created ON messages(organization_id, conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_org_last_msg ON conversations(organization_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhooks_org_created ON webhooks(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_org_date ON appointments(organization_id, appointment_date);

-- Phase 5: Default transition rules
CREATE OR REPLACE FUNCTION create_default_transition_rules(org_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO temperature_transition_rules 
    (organization_id, name, trigger_event, from_temperature, condition_message_direction, 
     action_set_temperature, action_set_substatus, timer_minutes, priority, active)
  VALUES 
    (org_id, 'Ativar lead ao receber mensagem', 'message_received', 'novo', 'in', 
     'quente', 'em_conversa', 0, 1, true),
    (org_id, 'Reativar lead frio ao receber mensagem', 'message_received', 'frio', 'in', 
     'quente', 'em_conversa', 0, 2, true),
    (org_id, 'Manter engajamento ativo', 'message_received', 'quente', 'in', 
     NULL, 'em_conversa', 0, 3, true),
    (org_id, 'Lead novo inativo -> Frio', 'inactivity_timer', 'novo', NULL, 
     'frio', NULL, 1440, 4, true),
    (org_id, 'Lead quente inativo -> Frio', 'inactivity_timer', 'quente', NULL, 
     'frio', NULL, 2880, 5, true),
    (org_id, 'Timeout aguardando resposta', 'substatus_timeout', 'quente', NULL, 
     NULL, NULL, 4320, 6, true)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Phase 5: General settings fields
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS 
  logo_url TEXT,
  trade_name TEXT,
  document TEXT,
  phone TEXT,
  email TEXT,
  address JSONB DEFAULT '{}',
  business_hours JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  welcome_message TEXT,
  message_signature TEXT;

-- Phase 5: Lead email support for validation
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT;

-- Phase 5: Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
