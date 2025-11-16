-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    'recepcao'::app_role,
    true
  );
  
  -- Also create default role in user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'recepcao'::app_role);
  
  RETURN NEW;
END;
$$;

-- Trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  birth_date DATE,
  cpf TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  medical_history TEXT,
  allergies TEXT,
  medications TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on patients table
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- RLS policies for patients
CREATE POLICY "Authenticated users can view all patients"
  ON public.patients
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert patients"
  ON public.patients
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
  ON public.patients
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete patients"
  ON public.patients
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on patients
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data for leads (20 example leads)
INSERT INTO public.leads (name, phone, status, source_id, interest_id, notes, registration_date, scheduled, budget_total, appointment_date) VALUES
('Maria Silva Santos', '(11) 98765-4321', 'novo_lead', (SELECT id FROM sources LIMIT 1), (SELECT id FROM procedures WHERE category = 'Estética' LIMIT 1), 'Interessada em clareamento dental', CURRENT_DATE - INTERVAL '2 days', false, 1500.00, NULL),
('João Pedro Oliveira', '(11) 97654-3210', 'em_negociacao', (SELECT id FROM sources OFFSET 1 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Ortodontia' LIMIT 1), 'Quer iniciar tratamento ortodôntico', CURRENT_DATE - INTERVAL '5 days', true, 8000.00, CURRENT_DATE + INTERVAL '3 days'),
('Ana Paula Costa', '(11) 96543-2109', 'agendado', (SELECT id FROM sources OFFSET 2 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Implantes' LIMIT 1), 'Consulta de avaliação marcada', CURRENT_DATE - INTERVAL '7 days', true, 15000.00, CURRENT_DATE + INTERVAL '1 day'),
('Carlos Eduardo Lima', '(11) 95432-1098', 'atendido', (SELECT id FROM sources LIMIT 1), (SELECT id FROM procedures WHERE category = 'Estética' LIMIT 1), 'Atendimento inicial realizado', CURRENT_DATE - INTERVAL '10 days', true, 2000.00, CURRENT_DATE - INTERVAL '2 days'),
('Juliana Martins', '(11) 94321-0987', 'em_tratamento', (SELECT id FROM sources OFFSET 1 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Ortodontia' LIMIT 1), 'Aparelho instalado, em acompanhamento', CURRENT_DATE - INTERVAL '30 days', true, 6000.00, CURRENT_DATE - INTERVAL '25 days'),
('Roberto Almeida', '(11) 93210-9876', 'concluido', (SELECT id FROM sources OFFSET 2 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Estética' LIMIT 1), 'Tratamento de clareamento finalizado', CURRENT_DATE - INTERVAL '45 days', true, 1800.00, CURRENT_DATE - INTERVAL '40 days'),
('Fernanda Souza', '(11) 92109-8765', 'perdido', (SELECT id FROM sources LIMIT 1), (SELECT id FROM procedures WHERE category = 'Implantes' LIMIT 1), 'Não retornou contato, lead perdido', CURRENT_DATE - INTERVAL '60 days', false, 12000.00, NULL),
('Pedro Henrique', '(21) 98888-7777', 'novo_lead', (SELECT id FROM sources OFFSET 1 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Cirurgia' LIMIT 1), 'Interessado em extração de siso', CURRENT_DATE - INTERVAL '1 day', false, 2500.00, NULL),
('Camila Rodrigues', '(21) 97777-6666', 'em_negociacao', (SELECT id FROM sources OFFSET 2 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Ortodontia' LIMIT 1), 'Aguardando orçamento detalhado', CURRENT_DATE - INTERVAL '4 days', true, 7500.00, CURRENT_DATE + INTERVAL '5 days'),
('Lucas Ferreira', '(21) 96666-5555', 'agendado', (SELECT id FROM sources LIMIT 1), (SELECT id FROM procedures WHERE category = 'Estética' LIMIT 1), 'Primeira consulta agendada', CURRENT_DATE - INTERVAL '3 days', true, 1200.00, CURRENT_DATE + INTERVAL '2 days'),
('Mariana Gomes', '(21) 95555-4444', 'atendido', (SELECT id FROM sources OFFSET 1 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Implantes' LIMIT 1), 'Avaliação concluída, orçamento enviado', CURRENT_DATE - INTERVAL '8 days', true, 18000.00, CURRENT_DATE - INTERVAL '5 days'),
('Gabriel Santos', '(21) 94444-3333', 'em_tratamento', (SELECT id FROM sources OFFSET 2 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Ortodontia' LIMIT 1), '3º mês de tratamento', CURRENT_DATE - INTERVAL '90 days', true, 5500.00, CURRENT_DATE - INTERVAL '80 days'),
('Beatriz Lima', '(21) 93333-2222', 'novo_lead', (SELECT id FROM sources LIMIT 1), (SELECT id FROM procedures WHERE category = 'Estética' LIMIT 1), 'Quer orçamento para lente de contato', CURRENT_DATE, false, 5000.00, NULL),
('Rafael Costa', '(11) 92222-1111', 'em_negociacao', (SELECT id FROM sources OFFSET 1 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Implantes' LIMIT 1), 'Negociando formas de pagamento', CURRENT_DATE - INTERVAL '6 days', true, 20000.00, CURRENT_DATE + INTERVAL '4 days'),
('Amanda Oliveira', '(11) 91111-0000', 'agendado', (SELECT id FROM sources OFFSET 2 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Cirurgia' LIMIT 1), 'Cirurgia agendada', CURRENT_DATE - INTERVAL '12 days', true, 3500.00, CURRENT_DATE + INTERVAL '7 days'),
('Thiago Martins', '(11) 90000-9999', 'atendido', (SELECT id FROM sources LIMIT 1), (SELECT id FROM procedures WHERE category = 'Estética' LIMIT 1), 'Consulta realizada', CURRENT_DATE - INTERVAL '15 days', true, 2200.00, CURRENT_DATE - INTERVAL '10 days'),
('Patricia Silva', '(21) 98765-1234', 'concluido', (SELECT id FROM sources OFFSET 1 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Ortodontia' LIMIT 1), 'Tratamento ortodôntico finalizado', CURRENT_DATE - INTERVAL '180 days', true, 6500.00, CURRENT_DATE - INTERVAL '170 days'),
('Felipe Almeida', '(21) 97654-5678', 'perdido', (SELECT id FROM sources OFFSET 2 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Implantes' LIMIT 1), 'Não demonstrou interesse após orçamento', CURRENT_DATE - INTERVAL '50 days', false, 16000.00, NULL),
('Larissa Souza', '(11) 96543-8901', 'novo_lead', (SELECT id FROM sources LIMIT 1), (SELECT id FROM procedures WHERE category = 'Estética' LIMIT 1), 'Pediu informações sobre harmonização facial', CURRENT_DATE - INTERVAL '1 day', false, 4000.00, NULL),
('Rodrigo Ferreira', '(11) 95432-7890', 'em_negociacao', (SELECT id FROM sources OFFSET 1 LIMIT 1), (SELECT id FROM procedures WHERE category = 'Implantes' LIMIT 1), 'Analisando proposta de implante', CURRENT_DATE - INTERVAL '9 days', true, 14000.00, CURRENT_DATE + INTERVAL '6 days');