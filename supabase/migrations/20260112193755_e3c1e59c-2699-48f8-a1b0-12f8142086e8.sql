-- Fix upsert_lead_by_phone function by adding organization membership check
-- This prevents authenticated users from accessing/modifying leads in organizations they don't belong to
-- The check is skipped when auth.uid() is NULL (service role calls from Edge Functions)

CREATE OR REPLACE FUNCTION public.upsert_lead_by_phone(
  p_phone text, 
  p_organization_id uuid, 
  p_name text DEFAULT NULL::text, 
  p_source_id uuid DEFAULT NULL::uuid, 
  p_interest_id uuid DEFAULT NULL::uuid, 
  p_temperature text DEFAULT 'novo'::text, 
  p_status text DEFAULT NULL::text, 
  p_direction text DEFAULT 'in'::text
)
RETURNS TABLE(lead_id uuid, is_new boolean, lead_temperature text, lead_hot_substatus text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lead_id UUID;
  v_is_new BOOLEAN := FALSE;
  v_temp TEXT;
  v_substatus TEXT;
  v_default_status TEXT;
  v_caller_id UUID;
BEGIN
  -- Get the caller's user ID
  v_caller_id := auth.uid();
  
  -- Authorization check: If called by an authenticated user (not service role),
  -- verify they are a member of the target organization or a super admin
  IF v_caller_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = v_caller_id 
        AND organization_id = p_organization_id 
        AND active = true
    ) AND NOT EXISTS (
      SELECT 1 FROM public.super_admins 
      WHERE user_id = v_caller_id
    ) THEN
      RAISE EXCEPTION 'Access denied: not a member of organization %', p_organization_id;
    END IF;
  END IF;

  -- Buscar status default da organização
  SELECT name INTO v_default_status 
  FROM lead_statuses 
  WHERE organization_id = p_organization_id AND is_default = true
  LIMIT 1;
  
  IF v_default_status IS NULL THEN
    v_default_status := 'novo_lead';
  END IF;

  -- Tentar buscar lead existente com lock para evitar race condition
  SELECT l.id, l.temperature, l.hot_substatus 
  INTO v_lead_id, v_temp, v_substatus
  FROM leads l
  WHERE l.phone = p_phone 
    AND l.organization_id = p_organization_id
  ORDER BY l.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF v_lead_id IS NULL THEN
    -- Verificar novamente sem lock (caso outra transação tenha criado)
    SELECT l.id, l.temperature, l.hot_substatus 
    INTO v_lead_id, v_temp, v_substatus
    FROM leads l
    WHERE l.phone = p_phone 
      AND l.organization_id = p_organization_id
    ORDER BY l.created_at ASC
    LIMIT 1;
    
    IF v_lead_id IS NULL THEN
      -- Criar novo lead com status do gatilho ou default
      INSERT INTO leads (
        phone, name, organization_id, source_id, interest_id, 
        temperature, status, hot_substatus, last_interaction_at, notes
      )
      VALUES (
        p_phone, 
        p_name, 
        p_organization_id, 
        p_source_id, 
        p_interest_id, 
        p_temperature,
        COALESCE(p_status, v_default_status),
        CASE WHEN p_temperature = 'quente' THEN 'em_conversa' ELSE NULL END,
        NOW(), 
        'Contato iniciado via WhatsApp'
      )
      RETURNING leads.id, leads.temperature, leads.hot_substatus 
      INTO v_lead_id, v_temp, v_substatus;
      v_is_new := TRUE;
    END IF;
  END IF;
  
  -- Se não é novo e é mensagem de entrada, apenas atualizar last_interaction_at
  -- A mudança de temperatura/substatus será controlada pelas regras de transição
  IF NOT v_is_new AND p_direction = 'in' THEN
    UPDATE leads
    SET 
      last_interaction_at = NOW(),
      -- Aplicar source/interest/status do gatilho apenas se fornecidos
      source_id = COALESCE(p_source_id, source_id),
      interest_id = COALESCE(p_interest_id, interest_id),
      status = COALESCE(p_status, status)
    WHERE id = v_lead_id
    RETURNING temperature, hot_substatus INTO v_temp, v_substatus;
  END IF;
  
  RETURN QUERY SELECT v_lead_id, v_is_new, v_temp, v_substatus;
END;
$function$;