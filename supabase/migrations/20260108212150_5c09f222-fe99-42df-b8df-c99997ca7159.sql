-- Atualizar função upsert_lead_by_phone para incluir p_status e aplicar ações do gatilho
CREATE OR REPLACE FUNCTION public.upsert_lead_by_phone(
  p_phone TEXT,
  p_organization_id UUID,
  p_name TEXT DEFAULT NULL,
  p_source_id UUID DEFAULT NULL,
  p_interest_id UUID DEFAULT NULL,
  p_temperature TEXT DEFAULT 'novo',
  p_status TEXT DEFAULT NULL,
  p_direction TEXT DEFAULT 'in'
)
RETURNS TABLE(lead_id UUID, is_new BOOLEAN, lead_temperature TEXT, lead_hot_substatus TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- Se não é novo e é mensagem de entrada, atualizar status e aplicar ações do gatilho
  IF NOT v_is_new AND p_direction = 'in' THEN
    UPDATE leads
    SET 
      last_interaction_at = NOW(),
      -- Aplicar source/interest/status do gatilho apenas se fornecidos
      source_id = COALESCE(p_source_id, source_id),
      interest_id = COALESCE(p_interest_id, interest_id),
      status = COALESCE(p_status, status),
      -- Manter lógica existente de temperatura
      temperature = CASE 
        WHEN temperature IN ('novo', 'frio') THEN 'quente' 
        ELSE temperature 
      END,
      hot_substatus = CASE 
        WHEN temperature IN ('novo', 'frio', 'quente') THEN 'em_conversa' 
        ELSE hot_substatus 
      END
    WHERE id = v_lead_id
    RETURNING temperature, hot_substatus INTO v_temp, v_substatus;
  END IF;
  
  RETURN QUERY SELECT v_lead_id, v_is_new, v_temp, v_substatus;
END;
$$;