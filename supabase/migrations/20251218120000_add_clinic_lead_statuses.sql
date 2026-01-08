-- Add clinic default lead statuses for existing organizations
INSERT INTO public.lead_statuses (organization_id, name, title, color, position, is_default)
SELECT
  o.id,
  s.name,
  s.title,
  s.color,
  COALESCE(
    (SELECT MAX(position) FROM public.lead_statuses WHERE organization_id = o.id),
    0
  ) + s.position_offset,
  false
FROM public.organizations o
CROSS JOIN (
  VALUES
    ('triagem', 'Triagem', 'bg-sky-500', 1),
    ('avaliacao', 'Avaliação', 'bg-amber-500', 2),
    ('pos_consulta', 'Pós-consulta', 'bg-emerald-500', 3)
) AS s(name, title, color, position_offset)
WHERE o.active = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.lead_statuses ls
    WHERE ls.organization_id = o.id
      AND ls.name = s.name
  );
