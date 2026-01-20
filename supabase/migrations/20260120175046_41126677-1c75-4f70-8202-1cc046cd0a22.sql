-- Adicionar colunas para histórico detalhado em patients
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS appointments_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS attendances_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS quotes_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sales_history JSONB DEFAULT '[]'::jsonb;

-- Adicionar colunas para histórico detalhado em leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS appointments_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS attendances_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS quotes_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sales_history JSONB DEFAULT '[]'::jsonb;