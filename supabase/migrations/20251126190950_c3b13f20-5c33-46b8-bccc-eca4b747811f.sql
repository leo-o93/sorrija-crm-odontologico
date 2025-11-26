-- Corrigir leads com status inválido (UUIDs ou valores não permitidos)
UPDATE leads 
SET status = 'novo_lead', 
    updated_at = now()
WHERE status NOT IN (
  'novo_lead', 
  'primeira_tentativa', 
  'segunda_tentativa', 
  'terceira_tentativa',
  'agendado',
  'compareceu',
  'nao_compareceu',
  'orcamento_enviado',
  'fechado',
  'perdido'
);

-- Adicionar constraint para validar status no futuro
ALTER TABLE leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN (
  'novo_lead', 
  'primeira_tentativa', 
  'segunda_tentativa', 
  'terceira_tentativa',
  'agendado',
  'compareceu',
  'nao_compareceu',
  'orcamento_enviado',
  'fechado',
  'perdido'
));