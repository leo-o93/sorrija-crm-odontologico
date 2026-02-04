ALTER TABLE public.internal_chat_rooms
ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.internal_chat_room_members
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

UPDATE public.internal_chat_room_members
SET last_read_at = COALESCE(last_read_at, created_at);

DROP POLICY IF EXISTS "Users can view internal chat rooms in their org" ON public.internal_chat_rooms;
CREATE POLICY "Users can view internal chat rooms in their org"
ON public.internal_chat_rooms
FOR SELECT
TO authenticated
USING (
  organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  AND (
    is_private IS FALSE
    OR id IN (
      SELECT room_id
      FROM public.internal_chat_room_members
      WHERE user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gerente'::app_role)
    OR is_super_admin()
  )
);
