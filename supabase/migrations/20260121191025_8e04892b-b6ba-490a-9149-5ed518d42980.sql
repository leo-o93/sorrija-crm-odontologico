-- =============================================
-- FIX 1: Make whatsapp-media bucket private and add RLS policies
-- =============================================
UPDATE storage.buckets 
SET public = false 
WHERE id = 'whatsapp-media';

-- Drop existing storage policies for whatsapp-media
DROP POLICY IF EXISTS "Public can view whatsapp media" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view whatsapp media" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload whatsapp media" ON storage.objects;
DROP POLICY IF EXISTS "Org members can update whatsapp media" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete whatsapp media" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

-- Create new restrictive policies for whatsapp-media bucket
-- Organization members can view media from their organizations
CREATE POLICY "Authenticated org members can view whatsapp media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'whatsapp-media' 
  AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_organization_ids(auth.uid()))
);

-- Organization members can upload media to their organizations
CREATE POLICY "Authenticated org members can upload whatsapp media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'whatsapp-media' 
  AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_organization_ids(auth.uid()))
);

-- Organization members can update their org's media
CREATE POLICY "Authenticated org members can update whatsapp media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'whatsapp-media' 
  AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_organization_ids(auth.uid()))
);

-- Organization members can delete their org's media
CREATE POLICY "Authenticated org members can delete whatsapp media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'whatsapp-media' 
  AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_organization_ids(auth.uid()))
);

-- Service role can manage all media (for edge functions)
CREATE POLICY "Service role can manage all whatsapp media"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'whatsapp-media')
WITH CHECK (bucket_id = 'whatsapp-media');

-- =============================================
-- FIX 2: Profiles table - Add explicit TO authenticated
-- =============================================
-- First check if profiles table exists and has RLS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Super admins can manage profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
    
    -- Create new policy with TO authenticated
    CREATE POLICY "Authenticated users can view profiles in their org"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
      id = auth.uid() OR
      id IN (
        SELECT om.user_id 
        FROM organization_members om 
        WHERE om.organization_id IN (SELECT get_user_organization_ids(auth.uid()))
      ) OR
      is_super_admin()
    );
    
    CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
    
    CREATE POLICY "Super admins can manage all profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());
  END IF;
END $$;

-- =============================================
-- FIX 3: Organizations table - Ensure TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can view all organizations" ON public.organizations;

CREATE POLICY "Authenticated users can view their organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Authenticated admins can manage organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can manage all organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- =============================================
-- FIX 4: Leads table - Ensure TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Users can view leads from their organization" ON public.leads;
DROP POLICY IF EXISTS "Users can manage leads in their organization" ON public.leads;

CREATE POLICY "Authenticated users can view leads from their org"
ON public.leads
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Authenticated users can manage leads in their org"
ON public.leads
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

-- =============================================
-- FIX 5: Patients table - Ensure TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Staff can view patients from their organization" ON public.patients;
DROP POLICY IF EXISTS "Users can manage patients in their organization" ON public.patients;

CREATE POLICY "Authenticated staff can view patients from their org"
ON public.patients
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Authenticated users can manage patients in their org"
ON public.patients
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

-- =============================================
-- FIX 6: Quotes table - Ensure TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Users can view quotes from their organization" ON public.quotes;
DROP POLICY IF EXISTS "Users can manage quotes in their organization" ON public.quotes;

CREATE POLICY "Authenticated users can view quotes from their org"
ON public.quotes
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Authenticated users can manage quotes in their org"
ON public.quotes
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

-- =============================================
-- FIX 7: Suppliers table - Ensure TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Users can view suppliers from their organization" ON public.suppliers;
DROP POLICY IF EXISTS "Users can manage suppliers in their organization" ON public.suppliers;

CREATE POLICY "Authenticated users can view suppliers from their org"
ON public.suppliers
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Authenticated users can manage suppliers in their org"
ON public.suppliers
FOR ALL
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())))
WITH CHECK (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

-- =============================================
-- FIX 8: Messages table - Ensure TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Staff can view messages from their organization" ON public.messages;
DROP POLICY IF EXISTS "Users can manage messages in their organization" ON public.messages;

CREATE POLICY "Authenticated staff can view messages from their org"
ON public.messages
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Authenticated users can manage messages in their org"
ON public.messages
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

-- =============================================
-- FIX 9: Webhooks table - Ensure TO authenticated (admin only)
-- =============================================
DROP POLICY IF EXISTS "Admins can view webhooks from their organization" ON public.webhooks;
DROP POLICY IF EXISTS "Admins can manage webhooks in their organization" ON public.webhooks;

CREATE POLICY "Authenticated admins can view webhooks from their org"
ON public.webhooks
FOR SELECT
TO authenticated
USING (
  organization_id IN (SELECT get_user_organization_ids(auth.uid())) 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role) OR is_super_admin())
);

CREATE POLICY "Authenticated admins can manage webhooks in their org"
ON public.webhooks
FOR ALL
TO authenticated
USING (
  organization_id IN (SELECT get_user_organization_ids(auth.uid())) 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role) OR is_super_admin())
)
WITH CHECK (
  organization_id IN (SELECT get_user_organization_ids(auth.uid())) 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role) OR is_super_admin())
);

-- =============================================
-- FIX 10: Appointments table - Ensure TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Staff can view appointments from their organization" ON public.appointments;
DROP POLICY IF EXISTS "Users can manage appointments in their organization" ON public.appointments;

CREATE POLICY "Authenticated staff can view appointments from their org"
ON public.appointments
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Authenticated users can manage appointments in their org"
ON public.appointments
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