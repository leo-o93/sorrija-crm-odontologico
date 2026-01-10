-- =========================================
-- FASE 1: CORREÇÕES DE PERMISSÕES E RLS
-- =========================================

-- 1. Atualizar default role em organization_members para 'usuario'
ALTER TABLE organization_members ALTER COLUMN role SET DEFAULT 'usuario'::app_role;

-- 2. Criar índices de performance se não existirem
CREATE INDEX IF NOT EXISTS idx_leads_org_status ON leads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_org_temp ON leads(organization_id, temperature);
CREATE INDEX IF NOT EXISTS idx_conversations_org_phone ON conversations(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org_date ON appointments(organization_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_patients_org_phone ON patients(organization_id, phone);

-- 3. Função auxiliar para verificar se usuário pode enviar mensagens
CREATE OR REPLACE FUNCTION public.can_send_messages(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id 
      AND organization_id = _org_id
      AND active = true
      AND role IN ('admin', 'usuario')
  )
$$;

-- 4. Função para verificar membership ativo
CREATE OR REPLACE FUNCTION public.is_active_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id 
      AND organization_id = _org_id
      AND active = true
  )
$$;