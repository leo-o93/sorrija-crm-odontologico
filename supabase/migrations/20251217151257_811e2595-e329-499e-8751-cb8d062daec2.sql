-- Create lead_statuses table for configurable Kanban columns
CREATE TABLE public.lead_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-blue-500',
  position INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint for name per organization
CREATE UNIQUE INDEX idx_lead_statuses_org_name ON public.lead_statuses(organization_id, name) WHERE active = true;

-- Create index for ordering
CREATE INDEX idx_lead_statuses_org_position ON public.lead_statuses(organization_id, position);

-- Enable RLS
ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view lead statuses from their organization"
ON public.lead_statuses
FOR SELECT
USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Admins can manage lead statuses in their organization"
ON public.lead_statuses
FOR ALL
USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
);

-- Insert default statuses for existing organizations
INSERT INTO public.lead_statuses (organization_id, name, title, color, position, is_default)
SELECT 
  o.id,
  s.name,
  s.title,
  s.color,
  s.position,
  s.is_default
FROM public.organizations o
CROSS JOIN (
  VALUES 
    ('novo_lead', 'Novo Lead', 'bg-blue-500', 0, true),
    ('tentativa_1', '1ª Tentativa', 'bg-yellow-500', 1, false),
    ('tentativa_2', '2ª Tentativa', 'bg-orange-500', 2, false),
    ('tentativa_3', '3ª Tentativa', 'bg-red-400', 3, false),
    ('agendado', 'Agendado', 'bg-purple-500', 4, false),
    ('compareceu', 'Compareceu', 'bg-teal-500', 5, false),
    ('nao_compareceu', 'Não Compareceu', 'bg-red-500', 6, false),
    ('orcamento_enviado', 'Orçamento Enviado', 'bg-indigo-500', 7, false),
    ('fechado', 'Fechado', 'bg-green-500', 8, false),
    ('perdido', 'Perdido', 'bg-gray-500', 9, false)
) AS s(name, title, color, position, is_default)
WHERE o.active = true;