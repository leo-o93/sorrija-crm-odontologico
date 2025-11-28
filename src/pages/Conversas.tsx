import { useState } from 'react';
import { ConversationList } from '@/components/inbox/ConversationList';
import { ChatView } from '@/components/inbox/ChatView';
import { ContactSidebar } from '@/components/inbox/ContactSidebar';
import { useConversations } from '@/hooks/useConversations';
import { WhatsAppConfigGuard } from '@/components/layout/WhatsAppConfigGuard';

export default function Conversas() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('open');
  const { conversations, isLoading } = useConversations(statusFilter);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  return (
    <WhatsAppConfigGuard fallbackMessage="As conversas do WhatsApp requerem configuração da Evolution API.">
      <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Lista de conversas */}
      <div className="w-80 border-r border-border flex flex-col">
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>

      {/* Chat central */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ChatView conversationId={selectedConversationId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione uma conversa para começar
          </div>
        )}
      </div>

      {/* Painel lateral com dados do contato */}
      {selectedConversation && (
        <div className="w-80 border-l border-border">
          <ContactSidebar conversation={selectedConversation} />
        </div>
      )}
    </div>
    </WhatsAppConfigGuard>
  );
}
