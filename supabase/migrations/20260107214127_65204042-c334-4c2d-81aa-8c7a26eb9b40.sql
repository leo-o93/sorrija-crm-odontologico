-- Adicionar novos campos de timer na tabela crm_settings
ALTER TABLE crm_settings 
ADD COLUMN IF NOT EXISTS new_to_cold_hours integer DEFAULT 24,
ADD COLUMN IF NOT EXISTS em_conversa_timeout_minutes integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS enable_substatus_timeout boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS aguardando_to_cold_hours integer DEFAULT 48;

-- Comentários para documentação
COMMENT ON COLUMN crm_settings.new_to_cold_hours IS 'Horas para lead NOVO virar FRIO sem interação';
COMMENT ON COLUMN crm_settings.em_conversa_timeout_minutes IS 'Minutos para limpar substatus em_conversa';
COMMENT ON COLUMN crm_settings.enable_substatus_timeout IS 'Ativar timeout automático do substatus';
COMMENT ON COLUMN crm_settings.aguardando_to_cold_hours IS 'Horas para lead aguardando_resposta virar FRIO';