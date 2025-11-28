-- Criar tabela de categorias de despesas
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT expense_categories_type_check CHECK (type IN ('receita', 'despesa'))
);

-- Criar tabela de formas de pagamento
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT payment_methods_type_check CHECK (type IN ('dinheiro', 'pix', 'credito', 'debito', 'boleto', 'transferencia'))
);

-- Criar tabela de transações financeiras
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT financial_transactions_type_check CHECK (type IN ('receita', 'despesa')),
  CONSTRAINT financial_transactions_status_check CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'))
);

-- Criar tabela de metas financeiras
CREATE TABLE public.financial_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  period_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT financial_goals_period_check CHECK (period_type IN ('monthly', 'quarterly', 'yearly'))
);

-- Criar índices para melhor performance
CREATE INDEX idx_financial_transactions_date ON public.financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_status ON public.financial_transactions(status);
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX idx_financial_transactions_category ON public.financial_transactions(category_id);
CREATE INDEX idx_financial_transactions_quote ON public.financial_transactions(quote_id);
CREATE INDEX idx_financial_goals_period ON public.financial_goals(period_start, period_end);

-- Criar trigger para updated_at
CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para expense_categories
CREATE POLICY "Permitir leitura de categorias"
  ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY "Permitir criação de categorias"
  ON public.expense_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de categorias"
  ON public.expense_categories FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de categorias"
  ON public.expense_categories FOR DELETE USING (true);

-- Políticas RLS para payment_methods
CREATE POLICY "Permitir leitura de formas de pagamento"
  ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Permitir criação de formas de pagamento"
  ON public.payment_methods FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de formas de pagamento"
  ON public.payment_methods FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de formas de pagamento"
  ON public.payment_methods FOR DELETE USING (true);

-- Políticas RLS para financial_transactions
CREATE POLICY "Permitir leitura de transações"
  ON public.financial_transactions FOR SELECT USING (true);
CREATE POLICY "Permitir criação de transações"
  ON public.financial_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de transações"
  ON public.financial_transactions FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de transações"
  ON public.financial_transactions FOR DELETE USING (true);

-- Políticas RLS para financial_goals
CREATE POLICY "Permitir leitura de metas"
  ON public.financial_goals FOR SELECT USING (true);
CREATE POLICY "Permitir criação de metas"
  ON public.financial_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de metas"
  ON public.financial_goals FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de metas"
  ON public.financial_goals FOR DELETE USING (true);

-- Inserir categorias padrão
INSERT INTO public.expense_categories (name, type, color, icon) VALUES
  ('Materiais Odontológicos', 'despesa', '#ef4444', 'Package'),
  ('Salários e Encargos', 'despesa', '#f59e0b', 'Users'),
  ('Marketing e Publicidade', 'despesa', '#8b5cf6', 'Megaphone'),
  ('Aluguel e Condomínio', 'despesa', '#3b82f6', 'Home'),
  ('Energia e Água', 'despesa', '#10b981', 'Zap'),
  ('Internet e Telefone', 'despesa', '#06b6d4', 'Wifi'),
  ('Manutenção e Limpeza', 'despesa', '#6366f1', 'Wrench'),
  ('Impostos e Taxas', 'despesa', '#ec4899', 'FileText'),
  ('Consultas', 'receita', '#10b981', 'DollarSign'),
  ('Tratamentos', 'receita', '#3b82f6', 'Heart'),
  ('Procedimentos Estéticos', 'receita', '#8b5cf6', 'Sparkles'),
  ('Orçamentos Aprovados', 'receita', '#06b6d4', 'CheckCircle');

-- Inserir formas de pagamento padrão
INSERT INTO public.payment_methods (name, type) VALUES
  ('Dinheiro', 'dinheiro'),
  ('PIX', 'pix'),
  ('Cartão de Crédito', 'credito'),
  ('Cartão de Débito', 'debito'),
  ('Boleto Bancário', 'boleto'),
  ('Transferência Bancária', 'transferencia');