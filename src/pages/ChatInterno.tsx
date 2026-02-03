import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCreateInternalChatRoom,
  useInternalChatMembers,
  useInternalChatMessages,
  useInternalChatRooms,
  useJoinInternalChatRoom,
  useSendInternalChatMessage,
} from "@/hooks/useInternalChat";

export default function ChatInterno() {
  const { user, hasRole } = useAuth();
  const { data: rooms, isLoading: roomsLoading } = useInternalChatRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [messageDraft, setMessageDraft] = useState("");

  const createRoom = useCreateInternalChatRoom();
  const joinRoom = useJoinInternalChatRoom();
  const sendMessage = useSendInternalChatMessage();

  const { data: members } = useInternalChatMembers(selectedRoomId || undefined);
  const { data: messages, isLoading: messagesLoading } = useInternalChatMessages(selectedRoomId || undefined);

  const { data: myMemberships } = useQuery({
    queryKey: ["internal-chat-my-memberships", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("internal_chat_room_members")
        .select("room_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data?.map((item) => item.room_id) ?? [];
    },
    enabled: !!user?.id,
  });

  const membershipSet = useMemo(() => new Set(myMemberships || []), [myMemberships]);
  const isMember = selectedRoomId ? membershipSet.has(selectedRoomId) : false;

  const selectedRoom = useMemo(
    () => rooms?.find((room) => room.id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  const canManageRooms = hasRole("admin") || hasRole("gerente");

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    await createRoom.mutateAsync({ name: roomName.trim(), description: roomDescription.trim() || undefined });
    setRoomName("");
    setRoomDescription("");
    setIsCreateOpen(false);
  };

  const handleSendMessage = async () => {
    if (!selectedRoomId || !messageDraft.trim()) return;
    await sendMessage.mutateAsync({ roomId: selectedRoomId, content: messageDraft.trim() });
    setMessageDraft("");
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <Card className="w-72 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Salas</h2>
          {canManageRooms && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              Nova
            </Button>
          )}
        </div>

        {roomsLoading ? (
          <p className="text-sm text-muted-foreground">Carregando salas...</p>
        ) : rooms && rooms.length > 0 ? (
          <div className="flex flex-col gap-2 overflow-y-auto">
            {rooms.map((room) => {
              const active = room.id === selectedRoomId;
              const isRoomMember = membershipSet.has(room.id);
              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    active ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{room.name}</span>
                    <Badge variant={isRoomMember ? "default" : "secondary"}>
                      {isRoomMember ? "Membro" : "Visitante"}
                    </Badge>
                  </div>
                  {room.description && (
                    <p className="text-xs text-muted-foreground mt-1">{room.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma sala criada.</p>
        )}
      </Card>

      <Card className="flex-1 p-4 flex flex-col">
        {!selectedRoom ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Selecione uma sala para começar.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-semibold">{selectedRoom.name}</h2>
                {selectedRoom.description && (
                  <p className="text-sm text-muted-foreground">{selectedRoom.description}</p>
                )}
              </div>
              {!isMember && (
                <Button size="sm" onClick={() => joinRoom.mutate(selectedRoom.id)} disabled={joinRoom.isPending}>
                  Entrar na sala
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {messagesLoading ? (
                <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
              ) : messages && messages.length > 0 ? (
                messages.map((message) => {
                  const isMine = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                        isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                      >
                        <p className="text-xs opacity-70">
                          {isMine ? "Você" : message.sender_id.slice(0, 8)} •{" "}
                          {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
              )}
            </div>

            <div className="border-t pt-3">
              <div className="flex gap-2">
                <Textarea
                  rows={2}
                  placeholder={isMember ? "Digite sua mensagem..." : "Entre na sala para enviar mensagens"}
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  disabled={!isMember}
                />
                <Button onClick={handleSendMessage} disabled={!isMember || sendMessage.isPending}>
                  Enviar
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova sala</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nome da sala"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
            />
            <Textarea
              rows={3}
              placeholder="Descrição (opcional)"
              value={roomDescription}
              onChange={(event) => setRoomDescription(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRoom} disabled={createRoom.isPending}>
                Criar sala
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
