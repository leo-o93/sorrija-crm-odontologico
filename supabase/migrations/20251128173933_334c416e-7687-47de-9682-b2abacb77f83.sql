-- ====================================
-- FASE 1: CRIAR ESTRUTURA DE ORGANIZAÇÕES
-- ====================================

-- Criar tabela de organizações
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evolution_instance TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de membros de organização
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- ====================================
-- FASE 2: ADICIONAR organization_id ÀS TABELAS EXISTENTES
-- ====================================

-- Adicionar organization_id às tabelas
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.financial_goals ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.webhooks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- ====================================
-- FASE 3: MIGRAR DADOS EXISTENTES
-- ====================================

-- Criar organização padrão para dados existentes (se houver evolution_config)
DO $$
DECLARE
  default_org_id UUID;
  default_instance TEXT;
BEGIN
  -- Buscar a primeira instância ativa
  SELECT evolution_instance INTO default_instance 
  FROM public.evolution_config 
  WHERE active = true 
  LIMIT 1;
  
  IF default_instance IS NOT NULL THEN
    -- Criar organização para a instância existente
    INSERT INTO public.organizations (evolution_instance, name)
    VALUES (default_instance, 'Organização Principal')
    ON CONFLICT (evolution_instance) DO NOTHING
    RETURNING id INTO default_org_id;
    
    -- Se já existia, buscar o id
    IF default_org_id IS NULL THEN
      SELECT id INTO default_org_id 
      FROM public.organizations 
      WHERE evolution_instance = default_instance;
    END IF;
    
    -- Associar todos os usuários existentes à organização padrão
    INSERT INTO public.organization_members (organization_id, user_id)
    SELECT default_org_id, id FROM auth.users
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    -- Migrar dados existentes para a organização padrão
    UPDATE public.leads SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.patients SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.appointments SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.quotes SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.financial_transactions SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.expense_categories SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.payment_methods SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.financial_goals SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.sources SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.procedures SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.webhooks SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- Migrar conversas baseado na evolution_instance
    UPDATE public.conversations 
    SET organization_id = default_org_id 
    WHERE evolution_instance = default_instance AND organization_id IS NULL;
    
    -- Migrar mensagens baseado na conversa
    UPDATE public.messages m
    SET organization_id = default_org_id
    FROM public.conversations c
    WHERE m.conversation_id = c.id 
    AND c.organization_id = default_org_id
    AND m.organization_id IS NULL;
  END IF;
END $$;

-- ====================================
-- FASE 4: CRIAR FUNÇÃO PARA OBTER ORGANIZAÇÕES DO USUÁRIO
-- ====================================

-- Função para obter IDs das organizações do usuário
CREATE OR REPLACE FUNCTION public.get_user_organization_ids(_user_id UUID DEFAULT auth.uid())
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = _user_id AND active = true;
$$;

-- ====================================
-- FASE 5: HABILITAR RLS NAS NOVAS TABELAS
-- ====================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- ====================================
-- FASE 6: CRIAR POLÍTICAS RLS BASEADAS EM ORGANIZAÇÃO
-- ====================================

-- Policies para organizations
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
CREATE POLICY "Users can view their organizations" ON public.organizations
FOR SELECT USING (
  id IN (SELECT get_user_organization_ids())
);

DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;
CREATE POLICY "Admins can manage organizations" ON public.organizations
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Policies para organization_members
DROP POLICY IF EXISTS "Users can view their memberships" ON public.organization_members;
CREATE POLICY "Users can view their memberships" ON public.organization_members
FOR SELECT USING (
  user_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can manage memberships" ON public.organization_members;
CREATE POLICY "Admins can manage memberships" ON public.organization_members
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Atualizar políticas existentes para incluir filtro de organização

-- Leads
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Comercial can manage leads" ON public.leads;
CREATE POLICY "Users can view leads from their organization" ON public.leads
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
);
CREATE POLICY "Comercial can manage leads in their organization" ON public.leads
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids()) AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'comercial'::app_role))
);

-- Patients
DROP POLICY IF EXISTS "Staff can view patients" ON public.patients;
DROP POLICY IF EXISTS "Recepcao and admin can manage patients" ON public.patients;
CREATE POLICY "Staff can view patients from their organization" ON public.patients
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
);
CREATE POLICY "Recepcao can manage patients in their organization" ON public.patients
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids()) AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'recepcao'::app_role))
);

-- Appointments
DROP POLICY IF EXISTS "Staff can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Recepcao can manage appointments" ON public.appointments;
CREATE POLICY "Staff can view appointments from their organization" ON public.appointments
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
);
CREATE POLICY "Recepcao can manage appointments in their organization" ON public.appointments
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids()) AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'recepcao'::app_role))
);

-- Conversations
DROP POLICY IF EXISTS "Staff can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Staff can manage conversations" ON public.conversations;
CREATE POLICY "Staff can view conversations from their organization" ON public.conversations
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
);
CREATE POLICY "Staff can manage conversations in their organization" ON public.conversations
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids()) AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'recepcao'::app_role) OR has_role(auth.uid(), 'comercial'::app_role))
);

-- Messages
DROP POLICY IF EXISTS "Staff can view messages" ON public.messages;
DROP POLICY IF EXISTS "Staff can manage messages" ON public.messages;
CREATE POLICY "Staff can view messages from their organization" ON public.messages
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
);
CREATE POLICY "Staff can manage messages in their organization" ON public.messages
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids()) AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'recepcao'::app_role) OR has_role(auth.uid(), 'comercial'::app_role))
);

-- Quotes
DROP POLICY IF EXISTS "Permitir leitura de orçamentos" ON public.quotes;
DROP POLICY IF EXISTS "Permitir criação de orçamentos" ON public.quotes;
DROP POLICY IF EXISTS "Permitir atualização de orçamentos" ON public.quotes;
DROP POLICY IF EXISTS "Permitir exclusão de orçamentos" ON public.quotes;
CREATE POLICY "Users can view quotes from their organization" ON public.quotes
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
);
CREATE POLICY "Users can manage quotes in their organization" ON public.quotes
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
);

-- Financial Transactions
DROP POLICY IF EXISTS "Permitir leitura de transações" ON public.financial_transactions;
DROP POLICY IF EXISTS "Permitir criação de transações" ON public.financial_transactions;
DROP POLICY IF EXISTS "Permitir atualização de transações" ON public.financial_transactions;
DROP POLICY IF EXISTS "Permitir exclusão de transações" ON public.financial_transactions;
CREATE POLICY "Users can view transactions from their organization" ON public.financial_transactions
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
);
CREATE POLICY "Users can manage transactions in their organization" ON public.financial_transactions
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
);

-- Expense Categories
DROP POLICY IF EXISTS "Permitir leitura de categorias" ON public.expense_categories;
DROP POLICY IF EXISTS "Permitir criação de categorias" ON public.expense_categories;
DROP POLICY IF EXISTS "Permitir atualização de categorias" ON public.expense_categories;
DROP POLICY IF EXISTS "Permitir exclusão de categorias" ON public.expense_categories;
CREATE POLICY "Users can view categories from their organization" ON public.expense_categories
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
);
CREATE POLICY "Users can manage categories in their organization" ON public.expense_categories
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
);

-- Payment Methods
DROP POLICY IF EXISTS "Permitir leitura de formas de pagamento" ON public.payment_methods;
DROP POLICY IF EXISTS "Permitir criação de formas de pagamento" ON public.payment_methods;
DROP POLICY IF EXISTS "Permitir atualização de formas de pagamento" ON public.payment_methods;
DROP POLICY IF EXISTS "Permitir exclusão de formas de pagamento" ON public.payment_methods;
CREATE POLICY "Users can view payment methods from their organization" ON public.payment_methods
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
);
CREATE POLICY "Users can manage payment methods in their organization" ON public.payment_methods
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
);

-- Financial Goals
DROP POLICY IF EXISTS "Permitir leitura de metas" ON public.financial_goals;
DROP POLICY IF EXISTS "Permitir criação de metas" ON public.financial_goals;
DROP POLICY IF EXISTS "Permitir atualização de metas" ON public.financial_goals;
DROP POLICY IF EXISTS "Permitir exclusão de metas" ON public.financial_goals;
CREATE POLICY "Users can view goals from their organization" ON public.financial_goals
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
);
CREATE POLICY "Users can manage goals in their organization" ON public.financial_goals
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids())
);

-- Sources
DROP POLICY IF EXISTS "Anyone authenticated can view sources" ON public.sources;
DROP POLICY IF EXISTS "Admin can manage sources" ON public.sources;
CREATE POLICY "Users can view sources from their organization" ON public.sources
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
);
CREATE POLICY "Admins can manage sources in their organization" ON public.sources
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids()) AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
);

-- Procedures
DROP POLICY IF EXISTS "Anyone authenticated can view procedures" ON public.procedures;
DROP POLICY IF EXISTS "Admin can manage procedures" ON public.procedures;
CREATE POLICY "Users can view procedures from their organization" ON public.procedures
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids())
);
CREATE POLICY "Admins can manage procedures in their organization" ON public.procedures
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids()) AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
);

-- Webhooks
DROP POLICY IF EXISTS "Admin can view webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Admin can manage webhooks" ON public.webhooks;
CREATE POLICY "Admins can view webhooks from their organization" ON public.webhooks
FOR SELECT USING (
  organization_id IN (SELECT get_user_organization_ids()) AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
);
CREATE POLICY "Admins can manage webhooks in their organization" ON public.webhooks
FOR ALL USING (
  organization_id IN (SELECT get_user_organization_ids()) AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
);

-- ====================================
-- FASE 7: CRIAR TRIGGERS PARA UPDATED_AT
-- ====================================

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();