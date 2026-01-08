-- 1. Adicionar nova coluna hot_to_cold_minutes
ALTER TABLE crm_settings ADD COLUMN IF NOT EXISTS hot_to_cold_minutes INTEGER DEFAULT 4320;

-- 2. Converter dados existentes: (days * 1440) + (hours * 60)
UPDATE crm_settings 
SET hot_to_cold_minutes = (COALESCE(hot_to_cold_days, 3) * 1440) + (COALESCE(hot_to_cold_hours, 0) * 60)
WHERE hot_to_cold_minutes IS NULL OR hot_to_cold_minutes = 4320;

-- 3. Remover colunas antigas
ALTER TABLE crm_settings DROP COLUMN IF EXISTS hot_to_cold_days;
ALTER TABLE crm_settings DROP COLUMN IF EXISTS hot_to_cold_hours;