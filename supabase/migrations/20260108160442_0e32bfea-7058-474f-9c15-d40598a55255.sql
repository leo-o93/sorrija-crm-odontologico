-- Renomear coluna de horas para minutos
ALTER TABLE crm_settings 
  RENAME COLUMN new_to_cold_hours TO new_to_cold_minutes;

-- Converter valores existentes de horas para minutos (1 hora = 60 minutos)
UPDATE crm_settings 
  SET new_to_cold_minutes = new_to_cold_minutes * 60;