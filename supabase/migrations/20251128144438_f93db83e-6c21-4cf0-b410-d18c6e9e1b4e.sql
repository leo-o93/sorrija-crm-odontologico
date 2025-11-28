-- Criar tabela de orçamentos
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  valid_until DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT quotes_status_check CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired', 'converted'))
);

-- Criar tabela de itens do orçamento
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  procedure_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT quote_items_quantity_check CHECK (quantity > 0)
);

-- Criar tabela de parcelas/pagamentos
CREATE TABLE public.quote_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT quote_payments_status_check CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'))
);

-- Criar índices para melhor performance
CREATE INDEX idx_quotes_lead_id ON public.quotes(lead_id);
CREATE INDEX idx_quotes_patient_id ON public.quotes(patient_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at);
CREATE INDEX idx_quote_items_quote_id ON public.quote_items(quote_id);
CREATE INDEX idx_quote_payments_quote_id ON public.quote_payments(quote_id);
CREATE INDEX idx_quote_payments_status ON public.quote_payments(status);

-- Criar trigger para updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para quotes (todos podem ver e gerenciar por enquanto)
CREATE POLICY "Permitir leitura de orçamentos"
  ON public.quotes
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir criação de orçamentos"
  ON public.quotes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de orçamentos"
  ON public.quotes
  FOR UPDATE
  USING (true);

CREATE POLICY "Permitir exclusão de orçamentos"
  ON public.quotes
  FOR DELETE
  USING (true);

-- Políticas RLS para quote_items
CREATE POLICY "Permitir leitura de itens de orçamento"
  ON public.quote_items
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir criação de itens de orçamento"
  ON public.quote_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de itens de orçamento"
  ON public.quote_items
  FOR UPDATE
  USING (true);

CREATE POLICY "Permitir exclusão de itens de orçamento"
  ON public.quote_items
  FOR DELETE
  USING (true);

-- Políticas RLS para quote_payments
CREATE POLICY "Permitir leitura de pagamentos de orçamento"
  ON public.quote_payments
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir criação de pagamentos de orçamento"
  ON public.quote_payments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de pagamentos de orçamento"
  ON public.quote_payments
  FOR UPDATE
  USING (true);

CREATE POLICY "Permitir exclusão de pagamentos de orçamento"
  ON public.quote_payments
  FOR DELETE
  USING (true);

-- Função para gerar número do orçamento
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.quotes
  WHERE quote_number LIKE year_prefix || '%';
  
  RETURN year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$;