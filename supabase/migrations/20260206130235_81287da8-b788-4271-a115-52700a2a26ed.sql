-- =============================================
-- BUG-001 FIX: Create Internal Chat Tables
-- =============================================

-- Table: internal_chat_rooms
CREATE TABLE public.internal_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: internal_chat_room_members
CREATE TABLE public.internal_chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.internal_chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Table: internal_chat_messages
CREATE TABLE public.internal_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.internal_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internal_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for internal_chat_rooms
CREATE POLICY "Members can view rooms in their org"
  ON public.internal_chat_rooms FOR SELECT
  USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Operational users can create rooms"
  ON public.internal_chat_rooms FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    AND has_operational_role(auth.uid())
  );

CREATE POLICY "Room creators can update their rooms"
  ON public.internal_chat_rooms FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Room creators can delete their rooms"
  ON public.internal_chat_rooms FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for internal_chat_room_members
CREATE POLICY "Members can view room membership"
  ON public.internal_chat_room_members FOR SELECT
  USING (
    room_id IN (
      SELECT id FROM public.internal_chat_rooms 
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can join public rooms or rooms they created"
  ON public.internal_chat_room_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND room_id IN (
      SELECT id FROM public.internal_chat_rooms 
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
      AND (is_private = false OR created_by = auth.uid())
    )
  );

CREATE POLICY "Admins can add members to any room"
  ON public.internal_chat_room_members FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    AND room_id IN (
      SELECT id FROM public.internal_chat_rooms 
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update their own membership"
  ON public.internal_chat_room_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can leave rooms"
  ON public.internal_chat_room_members FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for internal_chat_messages
CREATE POLICY "Room members can view messages"
  ON public.internal_chat_messages FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM public.internal_chat_room_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can send messages"
  ON public.internal_chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND room_id IN (
      SELECT room_id FROM public.internal_chat_room_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Senders can delete their own messages"
  ON public.internal_chat_messages FOR DELETE
  USING (sender_id = auth.uid());

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_chat_messages;

-- Create indices for performance
CREATE INDEX idx_internal_chat_rooms_org ON public.internal_chat_rooms(organization_id);
CREATE INDEX idx_internal_chat_rooms_created_by ON public.internal_chat_rooms(created_by);
CREATE INDEX idx_internal_chat_members_room ON public.internal_chat_room_members(room_id);
CREATE INDEX idx_internal_chat_members_user ON public.internal_chat_room_members(user_id);
CREATE INDEX idx_internal_chat_messages_room ON public.internal_chat_messages(room_id);
CREATE INDEX idx_internal_chat_messages_sender ON public.internal_chat_messages(sender_id);
CREATE INDEX idx_internal_chat_messages_created ON public.internal_chat_messages(created_at DESC);

-- Trigger for updated_at on rooms
CREATE TRIGGER update_internal_chat_rooms_updated_at
  BEFORE UPDATE ON public.internal_chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();