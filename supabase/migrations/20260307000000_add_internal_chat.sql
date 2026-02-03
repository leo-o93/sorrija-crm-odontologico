CREATE TABLE IF NOT EXISTS public.internal_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.internal_chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.internal_chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.internal_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.internal_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_chat_rooms_org ON public.internal_chat_rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_internal_chat_room_members_room ON public.internal_chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_internal_chat_room_members_user ON public.internal_chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_chat_messages_room ON public.internal_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_internal_chat_messages_created_at ON public.internal_chat_messages(created_at);

ALTER TABLE public.internal_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view internal chat rooms in their org" ON public.internal_chat_rooms;
DROP POLICY IF EXISTS "Admins can manage internal chat rooms" ON public.internal_chat_rooms;
DROP POLICY IF EXISTS "Users can view internal chat room members" ON public.internal_chat_room_members;
DROP POLICY IF EXISTS "Users can join internal chat rooms" ON public.internal_chat_room_members;
DROP POLICY IF EXISTS "Admins can manage internal chat room members" ON public.internal_chat_room_members;
DROP POLICY IF EXISTS "Users can view internal chat messages" ON public.internal_chat_messages;
DROP POLICY IF EXISTS "Users can send internal chat messages" ON public.internal_chat_messages;

CREATE POLICY "Users can view internal chat rooms in their org"
ON public.internal_chat_rooms
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Admins can manage internal chat rooms"
ON public.internal_chat_rooms
FOR ALL
TO authenticated
USING (
  organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  AND (has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gerente'::app_role)
    OR is_super_admin())
)
WITH CHECK (
  organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  AND (has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gerente'::app_role)
    OR is_super_admin())
);

CREATE POLICY "Users can view internal chat room members"
ON public.internal_chat_room_members
FOR SELECT
TO authenticated
USING (
  room_id IN (
    SELECT id
    FROM public.internal_chat_rooms
    WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  )
);

CREATE POLICY "Users can join internal chat rooms"
ON public.internal_chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND room_id IN (
    SELECT id
    FROM public.internal_chat_rooms
    WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  )
);

CREATE POLICY "Admins can manage internal chat room members"
ON public.internal_chat_room_members
FOR ALL
TO authenticated
USING (
  room_id IN (
    SELECT id
    FROM public.internal_chat_rooms
    WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  )
  AND (has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gerente'::app_role)
    OR is_super_admin())
)
WITH CHECK (
  room_id IN (
    SELECT id
    FROM public.internal_chat_rooms
    WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  )
  AND (has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gerente'::app_role)
    OR is_super_admin())
);

CREATE POLICY "Users can view internal chat messages"
ON public.internal_chat_messages
FOR SELECT
TO authenticated
USING (
  room_id IN (
    SELECT room_id
    FROM public.internal_chat_room_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send internal chat messages"
ON public.internal_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND room_id IN (
    SELECT room_id
    FROM public.internal_chat_room_members
    WHERE user_id = auth.uid()
  )
);

DROP TRIGGER IF EXISTS update_internal_chat_rooms_updated_at ON public.internal_chat_rooms;
CREATE TRIGGER update_internal_chat_rooms_updated_at
BEFORE UPDATE ON public.internal_chat_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
