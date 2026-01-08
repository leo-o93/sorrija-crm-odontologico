
-- Tabela de mapeamento @lid -> phone
CREATE TABLE IF NOT EXISTS lid_phone_mapping (
  lid_id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por phone
CREATE INDEX IF NOT EXISTS idx_lid_phone_mapping_phone ON lid_phone_mapping(phone);

-- RLS
ALTER TABLE lid_phone_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lid mappings from their org" ON lid_phone_mapping
  FOR SELECT USING (
    organization_id IN (SELECT get_user_organization_ids())
  );

CREATE POLICY "Service role can manage lid mappings" ON lid_phone_mapping
  FOR ALL USING (true) WITH CHECK (true);

-- Função para upsert de lead com lock para evitar race condition
CREATE OR REPLACE FUNCTION upsert_lead_by_phone(
  p_phone TEXT,
  p_organization_id UUID,
  p_name TEXT,
  p_source_id UUID DEFAULT NULL,
  p_interest_id UUID DEFAULT NULL,
  p_temperature TEXT DEFAULT 'novo',
  p_direction TEXT DEFAULT 'in'
)
RETURNS TABLE(
  lead_id UUID,
  is_new BOOLEAN,
  lead_temperature TEXT,
  lead_hot_substatus TEXT
) AS $$
DECLARE
  v_lead_id UUID;
  v_is_new BOOLEAN := FALSE;
  v_temp TEXT;
  v_substatus TEXT;
BEGIN
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
      -- Criar novo lead
      INSERT INTO leads (phone, name, organization_id, source_id, interest_id, temperature, hot_substatus, last_interaction_at, notes)
      VALUES (
        p_phone, 
        p_name, 
        p_organization_id, 
        p_source_id, 
        p_interest_id, 
        p_temperature, 
        CASE WHEN p_temperature = 'quente' THEN 'em_conversa' ELSE NULL END,
        NOW(), 
        'Contato iniciado via WhatsApp'
      )
      RETURNING leads.id, leads.temperature, leads.hot_substatus 
      INTO v_lead_id, v_temp, v_substatus;
      v_is_new := TRUE;
    END IF;
  END IF;
  
  -- Se não é novo e é mensagem de entrada, atualizar status
  IF NOT v_is_new AND p_direction = 'in' THEN
    UPDATE leads
    SET 
      last_interaction_at = NOW(),
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
