-- Ação 4: Criar índices críticos para performance
-- Índice para busca por telefone em leads (muito frequente)
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);

-- Índice para filtro por temperatura (usado no CRM e dashboards)
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON public.leads(temperature);

-- Índice composto para organização + status (filtro principal do Kanban)
CREATE INDEX IF NOT EXISTS idx_leads_org_status ON public.leads(organization_id, status);

-- Índice para busca de conversas por telefone e organização
CREATE INDEX IF NOT EXISTS idx_conversations_phone_org ON public.conversations(phone, organization_id);

-- Índice para ordenação de mensagens por conversa e data
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at DESC);

-- Índice para busca de leads por organização e temperatura
CREATE INDEX IF NOT EXISTS idx_leads_org_temperature ON public.leads(organization_id, temperature);

-- Índice para last_interaction_at (usado em transições automáticas)
CREATE INDEX IF NOT EXISTS idx_leads_last_interaction ON public.leads(last_interaction_at);

-- Ação 10: Configurar search_path nas functions para segurança
ALTER FUNCTION public.upsert_lead_by_phone SET search_path = public;
ALTER FUNCTION public.get_user_organization_ids SET search_path = public;
ALTER FUNCTION public.has_role SET search_path = public;
ALTER FUNCTION public.has_role_in_org SET search_path = public;
ALTER FUNCTION public.is_org_admin SET search_path = public;
ALTER FUNCTION public.generate_quote_number SET search_path = public;
ALTER FUNCTION public.cleanup_old_webhooks SET search_path = public;