-- Create professionals table
CREATE TABLE public.professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'dentista',
  phone TEXT,
  email TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_professionals_org ON public.professionals(organization_id);

-- Create professional availability table
CREATE TABLE public.professional_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_professional_availability_professional ON public.professional_availability(professional_id);

-- Enable RLS
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;

-- Professionals policies
CREATE POLICY "Users can view professionals from their organization"
ON public.professionals
FOR SELECT
USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Admins can manage professionals in their organization"
ON public.professionals
FOR ALL
USING (
  organization_id IN (SELECT get_user_organization_ids())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
);

-- Availability policies
CREATE POLICY "Users can view professional availability from their organization"
ON public.professional_availability
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = professional_availability.professional_id
      AND p.organization_id IN (SELECT get_user_organization_ids())
  )
);

CREATE POLICY "Admins can manage professional availability in their organization"
ON public.professional_availability
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = professional_availability.professional_id
      AND p.organization_id IN (SELECT get_user_organization_ids())
  )
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
);
