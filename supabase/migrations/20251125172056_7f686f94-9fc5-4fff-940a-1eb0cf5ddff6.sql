-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can manage organization members" ON public.organization_members;

-- Create SECURITY DEFINER function to get user's organization IDs
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_organization_ids(_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = _user_id AND active = true;
$$;

-- Create new policies without recursion
CREATE POLICY "Users can view their own memberships"
  ON public.organization_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view organization members"
  ON public.organization_members
  FOR SELECT
  USING (organization_id IN (SELECT public.get_user_organization_ids()));

-- Add INSERT policy for organization_members
CREATE POLICY "Users can create memberships for new organizations"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Add INSERT policy for organizations (needed for onboarding)
CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy to allow users to update organizations they own
CREATE POLICY "Members can update their organizations"
  ON public.organizations
  FOR UPDATE
  USING (id IN (SELECT public.get_user_organization_ids()));