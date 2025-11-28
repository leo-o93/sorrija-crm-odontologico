-- Enable RLS on all tables that don't have it yet
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Profiles policies (users can view all profiles, but only admins can manage them)
CREATE POLICY "Anyone authenticated can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies (only admins can manage roles)
CREATE POLICY "Anyone authenticated can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Leads policies (comercial, gerente, admin can manage)
CREATE POLICY "Authenticated users can view leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Comercial can manage leads"
  ON public.leads FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'comercial')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'comercial')
  );

-- Patients policies (recepcao, dentista can view; recepcao can manage)
CREATE POLICY "Staff can view patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'recepcao') OR 
    public.has_role(auth.uid(), 'dentista')
  );

CREATE POLICY "Recepcao and admin can manage patients"
  ON public.patients FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'recepcao')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'recepcao')
  );

-- Appointments policies
CREATE POLICY "Staff can view appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'recepcao') OR 
    public.has_role(auth.uid(), 'dentista')
  );

CREATE POLICY "Recepcao can manage appointments"
  ON public.appointments FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'recepcao')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'recepcao')
  );

-- Conversations and Messages policies
CREATE POLICY "Staff can view conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage conversations"
  ON public.conversations FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'recepcao') OR 
    public.has_role(auth.uid(), 'comercial')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'recepcao') OR 
    public.has_role(auth.uid(), 'comercial')
  );

CREATE POLICY "Staff can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage messages"
  ON public.messages FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'recepcao') OR 
    public.has_role(auth.uid(), 'comercial')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'recepcao') OR 
    public.has_role(auth.uid(), 'comercial')
  );

-- Procedures and Sources policies (reference data - all can view, admin can manage)
CREATE POLICY "Anyone authenticated can view procedures"
  ON public.procedures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage procedures"
  ON public.procedures FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  );

CREATE POLICY "Anyone authenticated can view sources"
  ON public.sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage sources"
  ON public.sources FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  );

-- Lead interactions policies
CREATE POLICY "Staff can view lead interactions"
  ON public.lead_interactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage lead interactions"
  ON public.lead_interactions FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'comercial')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente') OR 
    public.has_role(auth.uid(), 'comercial')
  );

-- Evolution config and integration settings (admin only)
CREATE POLICY "Admin can view evolution config"
  ON public.evolution_config FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  );

CREATE POLICY "Admin can manage evolution config"
  ON public.evolution_config FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  );

CREATE POLICY "Admin can view integration settings"
  ON public.integration_settings FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  );

CREATE POLICY "Admin can manage integration settings"
  ON public.integration_settings FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  );

-- Webhooks (admin only for debugging)
CREATE POLICY "Admin can view webhooks"
  ON public.webhooks FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  );

CREATE POLICY "Admin can manage webhooks"
  ON public.webhooks FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gerente')
  );