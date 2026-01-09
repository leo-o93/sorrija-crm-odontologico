-- Remove the older duplicate version of upsert_lead_by_phone (7 parameters, without p_status)
-- Keep only the newer version with 8 parameters that includes p_status support
DROP FUNCTION IF EXISTS public.upsert_lead_by_phone(
  text,  -- p_phone
  uuid,  -- p_organization_id
  text,  -- p_name
  uuid,  -- p_source_id
  uuid,  -- p_interest_id
  text,  -- p_temperature
  text   -- p_direction (7 params total)
);