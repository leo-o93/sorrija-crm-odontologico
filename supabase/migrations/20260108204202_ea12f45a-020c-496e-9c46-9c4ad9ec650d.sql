-- Ação 2: Corrigir RLS policy permissiva em lid_phone_mapping
-- Remover policy "always true" e substituir por uma mais restritiva

-- Remover a policy permissiva existente
DROP POLICY IF EXISTS "Service role can manage lid mappings" ON public.lid_phone_mapping;

-- Criar nova policy que permite gerenciamento apenas via service role key
-- (o service role bypassa RLS automaticamente, então não precisamos de policy ALL)
-- Mas precisamos de uma policy para INSERT/UPDATE via Edge Functions autenticadas
CREATE POLICY "Edge functions can manage lid mappings via organization"
ON public.lid_phone_mapping
FOR ALL
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids()))
WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));