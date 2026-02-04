ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS patient_origin TEXT,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_patients_archived_at ON public.patients(archived_at);

CREATE TABLE IF NOT EXISTS public.patient_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_id ON public.patient_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_org ON public.patient_notes(organization_id);

ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated staff can view patient notes from their org" ON public.patient_notes;
DROP POLICY IF EXISTS "Authenticated users can manage patient notes in their org" ON public.patient_notes;

CREATE POLICY "Authenticated staff can view patient notes from their org"
ON public.patient_notes
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Authenticated users can manage patient notes in their org"
ON public.patient_notes
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
