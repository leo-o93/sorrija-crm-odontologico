-- Criar enum para roles de usuários
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'comercial', 'recepcao', 'dentista');

-- 1. Tabela de perfis de usuários (profiles)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role app_role NOT NULL DEFAULT 'recepcao',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabela de user_roles (segurança)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Tabela de fontes/origens (sources)
CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  channel text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Tabela de procedimentos/interesses (procedures)
CREATE TABLE public.procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  default_price decimal(10,2),
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Tabela principal de leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  source_id uuid REFERENCES public.sources(id),
  interest_id uuid REFERENCES public.procedures(id),
  
  -- Contatos
  first_contact_channel text,
  first_contact_date timestamptz,
  second_contact_channel text,
  second_contact_date timestamptz,
  third_contact_channel text,
  third_contact_date timestamptz,
  
  -- Agendamento
  scheduled boolean NOT NULL DEFAULT false,
  scheduled_on_attempt text,
  appointment_date date,
  
  -- Avaliação e Status
  evaluation_result text,
  status text NOT NULL DEFAULT 'novo_lead',
  
  -- Financeiro
  budget_total decimal(10,2),
  budget_paid decimal(10,2),
  
  -- Observações
  notes text,
  
  -- Responsável
  responsible_user_id uuid REFERENCES auth.users(id),
  
  -- Controle
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Tabela de interações com leads
CREATE TABLE public.lead_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  interaction_date timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL,
  interaction_type text NOT NULL,
  summary text,
  outcome text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_leads_phone ON public.leads(phone);
CREATE INDEX idx_leads_registration_date ON public.leads(registration_date);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_source_id ON public.leads(source_id);
CREATE INDEX idx_leads_interest_id ON public.leads(interest_id);
CREATE INDEX idx_lead_interactions_lead_id ON public.lead_interactions(lead_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função security definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
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
      AND role = _role
  )
$$;

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sources (leitura pública para authenticated)
CREATE POLICY "Authenticated users can view sources"
ON public.sources FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage sources"
ON public.sources FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para procedures (leitura pública para authenticated)
CREATE POLICY "Authenticated users can view procedures"
ON public.procedures FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage procedures"
ON public.procedures FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para leads (acesso total para authenticated por enquanto)
CREATE POLICY "Authenticated users can view all leads"
ON public.leads FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para lead_interactions
CREATE POLICY "Authenticated users can view lead interactions"
ON public.lead_interactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert lead interactions"
ON public.lead_interactions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas RLS para profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Políticas RLS para user_roles
CREATE POLICY "Users can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Inserir fontes padrão
INSERT INTO public.sources (name, channel) VALUES
  ('Facebook', 'social'),
  ('Instagram', 'social'),
  ('Campanha', 'paid'),
  ('Indicação', 'referral'),
  ('Resgate', 'reactivation'),
  ('Google', 'search'),
  ('WhatsApp', 'direct'),
  ('Telefone', 'direct'),
  ('Site', 'organic');

-- Inserir procedimentos/interesses padrão
INSERT INTO public.procedures (name, category, default_price) VALUES
  ('Prótese Flexível', 'reabilitacao', 2500.00),
  ('Ortodontia', 'ortodontia', 1800.00),
  ('Aparelho', 'ortodontia', 1800.00),
  ('Limpeza', 'prevencao', 150.00),
  ('Clareamento', 'estetica', 800.00),
  ('Implante', 'reabilitacao', 3500.00),
  ('Faceta em Resina', 'estetica', 500.00),
  ('Avulso', 'geral', 0.00),
  ('Prótese', 'reabilitacao', 2000.00),
  ('Avaliação', 'geral', 0.00);