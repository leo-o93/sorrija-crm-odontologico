-- Migration to link orphaned leads and patients to organizations

-- Update leads without organization_id to link them to the first organization of their creator
UPDATE leads l
SET organization_id = (
  SELECT om.organization_id 
  FROM organization_members om 
  WHERE om.user_id = auth.uid()
  AND om.active = true
  ORDER BY om.created_at ASC
  LIMIT 1
)
WHERE l.organization_id IS NULL
AND EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.user_id = auth.uid() 
  AND om.active = true
);

-- Update patients without organization_id to link them to the first organization
UPDATE patients p
SET organization_id = (
  SELECT om.organization_id 
  FROM organization_members om 
  WHERE om.user_id = auth.uid()
  AND om.active = true
  ORDER BY om.created_at ASC
  LIMIT 1
)
WHERE p.organization_id IS NULL
AND EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.user_id = auth.uid() 
  AND om.active = true
);