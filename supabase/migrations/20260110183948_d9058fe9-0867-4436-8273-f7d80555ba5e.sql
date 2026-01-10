-- Adicionar coluna email na tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email text;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.leads.email IS 'Email do lead para contato';