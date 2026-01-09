CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_email TEXT,
  default_timezone TEXT DEFAULT 'America/Sao_Paulo',
  allow_new_organizations BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view admin settings" ON admin_settings
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Super admins can manage admin settings" ON admin_settings
  FOR ALL USING (is_super_admin());
