CREATE TABLE IF NOT EXISTS public.attendance_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_queue_org ON public.attendance_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_queue_status ON public.attendance_queue(status);
CREATE INDEX IF NOT EXISTS idx_attendance_queue_checked_in_at ON public.attendance_queue(checked_in_at);

ALTER TABLE public.attendance_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated staff can view attendance queue from their org" ON public.attendance_queue;
DROP POLICY IF EXISTS "Authenticated users can manage attendance queue in their org" ON public.attendance_queue;

CREATE POLICY "Authenticated staff can view attendance queue from their org"
ON public.attendance_queue
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Authenticated users can manage attendance queue in their org"
ON public.attendance_queue
FOR ALL
TO authenticated
USING (
  organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  AND has_operational_role(auth.uid())
)
WITH CHECK (
  organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  AND has_operational_role(auth.uid())
);

DROP TRIGGER IF EXISTS update_attendance_queue_updated_at ON public.attendance_queue;
CREATE TRIGGER update_attendance_queue_updated_at
BEFORE UPDATE ON public.attendance_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
