import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface InternalChatRoom {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  is_private: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalChatMember {
  id: string;
  room_id: string;
  user_id: string;
  role: string;
  created_at: string;
  last_read_at: string | null;
}

export interface InternalChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function useInternalChatRooms() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["internal-chat-rooms", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from("internal_chat_rooms" as any)
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as any[]) as InternalChatRoom[];
    },
  });

  useEffect(() => {
    if (!currentOrganization?.id) return undefined;

    const channel = supabase
      .channel("internal-chat-rooms-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "internal_chat_rooms",
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["internal-chat-rooms", currentOrganization.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization?.id, queryClient]);

  return query;
}

export function useInternalChatMembers(roomId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["internal-chat-members", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from("internal_chat_room_members" as any)
        .select("*")
        .eq("room_id", roomId);

      if (error) throw error;
      return (data as any[]) as InternalChatMember[];
    },
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!roomId) return undefined;

    const channel = supabase
      .channel(`internal-chat-members-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "internal_chat_room_members",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["internal-chat-members", roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, roomId]);

  return query;
}

export function useInternalChatMessages(roomId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["internal-chat-messages", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from("internal_chat_messages" as any)
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as any[]) as InternalChatMessage[];
    },
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!roomId) return undefined;

    const channel = supabase
      .channel(`internal-chat-messages-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "internal_chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["internal-chat-messages", roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, roomId]);

  return query;
}

export function useCreateInternalChatRoom() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; description?: string; isPrivate?: boolean }) => {
      if (!currentOrganization?.id) throw new Error("No organization selected");
      if (!user?.id) throw new Error("No user session");

      const { data: room, error } = await supabase
        .from("internal_chat_rooms" as any)
        .insert({
          organization_id: currentOrganization.id,
          name: input.name,
          description: input.description || null,
          is_private: input.isPrivate ?? false,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const roomData = room as any;
      const { error: memberError } = await supabase
        .from("internal_chat_room_members" as any)
        .upsert({
          room_id: roomData.id,
          user_id: user.id,
          role: "owner",
        }, { onConflict: "room_id,user_id", ignoreDuplicates: true });

      if (memberError) throw memberError;
      return roomData as InternalChatRoom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-chat-rooms"] });
      toast.success("Sala criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar sala: " + error.message);
    },
  });
}

export function useJoinInternalChatRoom() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user?.id) throw new Error("No user session");
      const { error } = await supabase
        .from("internal_chat_room_members" as any)
        .upsert({ room_id: roomId, user_id: user.id, role: "member" }, { onConflict: "room_id,user_id", ignoreDuplicates: true });

      if (error) throw error;
    },
    onSuccess: (_data, roomId) => {
      queryClient.invalidateQueries({ queryKey: ["internal-chat-members", roomId] });
      toast.success("Você entrou na sala.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao entrar na sala: " + error.message);
    },
  });
}

export function useSendInternalChatMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { roomId: string; content: string }) => {
      if (!user?.id) throw new Error("No user session");
      const { error } = await supabase
        .from("internal_chat_messages" as any)
        .insert({
          room_id: input.roomId,
          sender_id: user.id,
          content: input.content,
        });

      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ["internal-chat-messages", input.roomId] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao enviar mensagem: " + error.message);
    },
  });
}

export function useMarkInternalChatRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { roomId: string; lastReadAt: string }) => {
      if (!user?.id) throw new Error("No user session");
      const { error } = await supabase
        .from("internal_chat_room_members" as any)
        .update({ last_read_at: input.lastReadAt })
        .eq("room_id", input.roomId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ["internal-chat-members", input.roomId] });
      queryClient.invalidateQueries({ queryKey: ["internal-chat-my-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["internal-chat-unread"] });
    },
  });
}
