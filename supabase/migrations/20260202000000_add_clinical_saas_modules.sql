-- Clinical core tables
CREATE TABLE IF NOT EXISTS public.anamneses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  diagnosis TEXT,
  evolution_notes TEXT,
  performed_procedures JSONB NOT NULL DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.odontogram_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tooth_number TEXT NOT NULL,
  surface TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_progress', 'completed', 'canceled')),
  total_amount NUMERIC,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.treatment_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  treatment_plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Consent and document management
CREATE TABLE IF NOT EXISTS public.consent_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  signed_at TIMESTAMPTZ,
  signed_by TEXT,
  signature_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinical_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.clinical_documents(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory management
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  unit TEXT,
  min_stock INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SaaS billing and usage
CREATE TABLE IF NOT EXISTS public.billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  limits JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.billing_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'canceled')),
  current_period_start DATE,
  current_period_end DATE,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, metric, period_start, period_end)
);

-- Operational audit log
CREATE TABLE IF NOT EXISTS public.operational_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odontogram_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view anamneses" ON public.anamneses
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()));
CREATE POLICY "Users can manage anamneses" ON public.anamneses
  FOR ALL USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can view clinical records" ON public.clinical_records
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()));
CREATE POLICY "Users can manage clinical records" ON public.clinical_records
  FOR ALL USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can view odontogram entries" ON public.odontogram_entries
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()));
CREATE POLICY "Users can manage odontogram entries" ON public.odontogram_entries
  FOR ALL USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can view treatment plans" ON public.treatment_plans
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()));
CREATE POLICY "Users can manage treatment plans" ON public.treatment_plans
  FOR ALL USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can view treatment plan items" ON public.treatment_plan_items
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()));
CREATE POLICY "Users can manage treatment plan items" ON public.treatment_plan_items
  FOR ALL USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can view consent forms" ON public.consent_forms
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()));
CREATE POLICY "Users can manage consent forms" ON public.consent_forms
  FOR ALL USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can view clinical documents" ON public.clinical_documents
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()));
CREATE POLICY "Users can manage clinical documents" ON public.clinical_documents
  FOR ALL USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can view clinical attachments" ON public.clinical_attachments
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()));
CREATE POLICY "Users can manage clinical attachments" ON public.clinical_attachments
  FOR ALL USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can view inventory items" ON public.inventory_items
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()));
CREATE POLICY "Users can manage inventory items" ON public.inventory_items
  FOR ALL USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can view inventory movements" ON public.inventory_movements
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()));
CREATE POLICY "Users can manage inventory movements" ON public.inventory_movements
  FOR ALL USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can view billing plans" ON public.billing_plans
  FOR SELECT USING (is_super_admin());
CREATE POLICY "Super admins can manage billing plans" ON public.billing_plans
  FOR ALL USING (is_super_admin());

CREATE POLICY "Users can view subscriptions" ON public.organization_subscriptions
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());
CREATE POLICY "Super admins can manage subscriptions" ON public.organization_subscriptions
  FOR ALL USING (is_super_admin());

CREATE POLICY "Users can view usage counters" ON public.usage_counters
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());
CREATE POLICY "Super admins can manage usage counters" ON public.usage_counters
  FOR ALL USING (is_super_admin());

CREATE POLICY "Users can view audit log" ON public.operational_audit_log
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());
CREATE POLICY "Users can insert audit log" ON public.operational_audit_log
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_anamneses_org_patient ON public.anamneses(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_records_org_patient ON public.clinical_records(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_odontogram_org_patient ON public.odontogram_entries(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_org_patient ON public.treatment_plans(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_plan ON public.treatment_plan_items(treatment_plan_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_org_patient ON public.consent_forms(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_org_patient ON public.clinical_documents(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_attachments_org_patient ON public.clinical_attachments(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_org ON public.inventory_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_org_item ON public.inventory_movements(organization_id, item_id);
CREATE INDEX IF NOT EXISTS idx_billing_plans_active ON public.billing_plans(active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON public.organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_counters_org_metric ON public.usage_counters(organization_id, metric);
CREATE INDEX IF NOT EXISTS idx_operational_audit_org_created ON public.operational_audit_log(organization_id, created_at DESC);

-- updated_at triggers
CREATE TRIGGER update_anamneses_updated_at
  BEFORE UPDATE ON public.anamneses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinical_records_updated_at
  BEFORE UPDATE ON public.clinical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_odontogram_entries_updated_at
  BEFORE UPDATE ON public.odontogram_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at
  BEFORE UPDATE ON public.treatment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_plan_items_updated_at
  BEFORE UPDATE ON public.treatment_plan_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consent_forms_updated_at
  BEFORE UPDATE ON public.consent_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinical_documents_updated_at
  BEFORE UPDATE ON public.clinical_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinical_attachments_updated_at
  BEFORE UPDATE ON public.clinical_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_movements_updated_at
  BEFORE UPDATE ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_plans_updated_at
  BEFORE UPDATE ON public.billing_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_subscriptions_updated_at
  BEFORE UPDATE ON public.organization_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_counters_updated_at
  BEFORE UPDATE ON public.usage_counters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
