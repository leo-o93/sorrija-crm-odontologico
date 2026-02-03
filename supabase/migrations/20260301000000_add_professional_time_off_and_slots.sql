-- Extend professional availability with slot and break info
ALTER TABLE public.professional_availability
ADD COLUMN IF NOT EXISTS slot_minutes SMALLINT NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS break_start TIME,
ADD COLUMN IF NOT EXISTS break_end TIME;

-- Add professional reference to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON public.appointments(professional_id);

-- Create professional time off table
CREATE TABLE IF NOT EXISTS public.professional_time_off (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_professional_time_off_professional ON public.professional_time_off(professional_id);

-- Enable RLS
ALTER TABLE public.professional_time_off ENABLE ROW LEVEL SECURITY;

-- Time off policies
CREATE POLICY "Users can view professional time off from their organization"
ON public.professional_time_off
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = professional_time_off.professional_id
      AND p.organization_id IN (SELECT get_user_organization_ids())
  )
);

CREATE POLICY "Admins can manage professional time off in their organization"
ON public.professional_time_off
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = professional_time_off.professional_id
      AND p.organization_id IN (SELECT get_user_organization_ids())
  )
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
);
