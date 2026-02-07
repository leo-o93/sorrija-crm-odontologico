-- ==============================================
-- PHASE 0 HOTFIX: Create 5 missing critical tables
-- ==============================================

-- 1. PROFESSIONALS TABLE
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  role TEXT,
  phone TEXT,
  email TEXT,
  active BOOLEAN DEFAULT true,
  color_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view professionals" ON public.professionals
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Operational users can manage professionals" ON public.professionals
  FOR ALL USING (
    organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    AND has_operational_role(auth.uid())
  );

CREATE INDEX idx_professionals_org ON public.professionals(organization_id);
CREATE INDEX idx_professionals_active ON public.professionals(organization_id, active);

-- 2. PROFESSIONAL AVAILABILITY TABLE
CREATE TABLE public.professional_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_minutes INTEGER DEFAULT 30,
  break_start TIME,
  break_end TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view availability" ON public.professional_availability
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM public.professionals 
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
  );

CREATE POLICY "Operational users can manage availability" ON public.professional_availability
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM public.professionals 
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
    AND has_operational_role(auth.uid())
  );

CREATE INDEX idx_prof_availability_professional ON public.professional_availability(professional_id);

-- 3. PROFESSIONAL TIME OFF TABLE
CREATE TABLE public.professional_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.professional_time_off ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view time off" ON public.professional_time_off
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM public.professionals 
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
  );

CREATE POLICY "Operational users can manage time off" ON public.professional_time_off
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM public.professionals 
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
    AND has_operational_role(auth.uid())
  );

CREATE INDEX idx_prof_timeoff_professional ON public.professional_time_off(professional_id);
CREATE INDEX idx_prof_timeoff_date ON public.professional_time_off(date);

-- 4. ATTENDANCE QUEUE TABLE
CREATE TABLE public.attendance_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  checked_in_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.attendance_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view queue" ON public.attendance_queue
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Staff can manage queue" ON public.attendance_queue
  FOR ALL USING (
    organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    AND has_operational_role(auth.uid())
  );

CREATE INDEX idx_attendance_queue_org ON public.attendance_queue(organization_id);
CREATE INDEX idx_attendance_queue_status ON public.attendance_queue(organization_id, status);
CREATE INDEX idx_attendance_queue_date ON public.attendance_queue(checked_in_at);

-- Enable realtime for attendance queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_queue;

-- 5. PATIENT NOTES TABLE
CREATE TABLE public.patient_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view notes" ON public.patient_notes
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Staff can manage notes" ON public.patient_notes
  FOR ALL USING (
    organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    AND has_operational_role(auth.uid())
  );

CREATE INDEX idx_patient_notes_patient ON public.patient_notes(patient_id);
CREATE INDEX idx_patient_notes_org ON public.patient_notes(organization_id);

-- 6. ADD professional_id COLUMN TO APPOINTMENTS (if not exists)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES public.professionals(id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON public.appointments(professional_id);