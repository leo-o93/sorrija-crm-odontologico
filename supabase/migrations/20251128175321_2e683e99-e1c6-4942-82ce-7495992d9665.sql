-- Fase 2: Melhorias de Segurança

-- 1. Corrigir function search paths (segurança contra search_path attacks)
ALTER FUNCTION public.cleanup_old_webhooks() SET search_path = public;
ALTER FUNCTION public.generate_quote_number() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_user_organization_ids(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;

-- 2. Remover tabela duplicada evolution_config (funcionalidade migrada para integration_settings)
DROP TABLE IF EXISTS public.evolution_config CASCADE;