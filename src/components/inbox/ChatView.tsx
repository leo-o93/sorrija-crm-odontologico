import { useMessages } from '@/hooks/useMessages';
import { useConversation } from '@/hooks/useConversations';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';
import { Loader2 } from 'lucide-react';

interface ChatViewProps {
  conversationId: string;
}

export function ChatView({ conversationId }: ChatViewProps) {
  const { conversation, isLoading: conversationLoading } = useConversation(conversationId);
  const { messages, isLoading: messagesLoading } = useMessages(conversationId);

  if (conversationLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Conversa não encontrada
      </div>
    );
  }

  const contactName = conversation.contact_type === 'lead' && conversation.leads
    ? conversation.leads.name
    : conversation.contact_type === 'patient' && conversation.patients
    ? conversation.patients.name
    : conversation.phone;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">{contactName}</h3>
        <p className="text-sm text-muted-foreground">{conversation.phone}</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhuma mensagem ainda
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <MessageInput
          conversationId={conversationId}
          phone={conversation.phone}
          leadId={conversation.lead_id || undefined}
          patientId={conversation.patient_id || undefined}
        />
      </div>
    </div>
  );
}
