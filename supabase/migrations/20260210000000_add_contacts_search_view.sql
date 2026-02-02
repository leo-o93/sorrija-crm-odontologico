CREATE OR REPLACE VIEW public.contacts_search AS
SELECT
  leads.id,
  leads.organization_id,
  leads.name,
  leads.phone,
  NULL::TEXT AS cpf,
  NULL::TEXT AS email,
  'lead'::TEXT AS type
FROM public.leads
UNION ALL
SELECT
  patients.id,
  patients.organization_id,
  patients.name,
  patients.phone,
  patients.cpf,
  patients.email,
  'patient'::TEXT AS type
FROM public.patients;

GRANT SELECT ON public.contacts_search TO authenticated, anon;
