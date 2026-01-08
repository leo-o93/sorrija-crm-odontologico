-- Adicionar message_received ao constraint de trigger_event
ALTER TABLE temperature_transition_rules
DROP CONSTRAINT IF EXISTS temperature_transition_rules_trigger_event_check;

ALTER TABLE temperature_transition_rules
ADD CONSTRAINT temperature_transition_rules_trigger_event_check
CHECK (trigger_event IN ('inactivity_timer', 'substatus_timeout', 'no_response', 'message_received'));

-- Adicionar coluna para condição de direção da mensagem
ALTER TABLE temperature_transition_rules
ADD COLUMN IF NOT EXISTS condition_message_direction TEXT DEFAULT NULL;

-- Constraint para valores válidos de direção
ALTER TABLE temperature_transition_rules
ADD CONSTRAINT temperature_transition_rules_direction_check
CHECK (condition_message_direction IS NULL OR condition_message_direction IN ('in', 'out'));

-- Atualizar RPC upsert_lead_by_phone para remover lógica hardcoded de temperatura
-- A lógica será controlada pelas regras de transição configuráveis
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
BEGIN
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