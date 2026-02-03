import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Search } from 'lucide-react';
import { Conversation } from '@/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const normalizeStatus = (status?: string | null) => (status || "").toLowerCase();

const matchesLeadStatus = (leadStatus: string | null | undefined, matchers: string[]) => {
  const normalized = normalizeStatus(leadStatus);
  return matchers.some((matcher) => normalized.includes(matcher));
};

export function ConversationList({
  conversations,
  isLoading,
  selectedId,
  onSelect,
  statusFilter,
  onStatusFilterChange,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const getContactName = (conv: Conversation) => {
    if (conv.contact_type === 'lead' && conv.leads) {
      return conv.leads.name;
    }
    if (conv.contact_type === 'patient' && conv.patients) {
      return conv.patients.name;
    }
    return conv.phone;
  };

  const filteredConversations = useMemo(() => {
    const query = searchQuery.toLowerCase();

    const statusFiltered = conversations.filter((conv) => {
      switch (statusFilter) {
        case "open":
        case "pending":
        case "resolved":
        case "archived":
          return conv.status === statusFilter;
        case "patient":
          return conv.contact_type === "patient";
        case "scheduled":
          return conv.contact_type === "lead" && !!conv.leads?.scheduled;
        case "lost":
          return conv.contact_type === "lead" && matchesLeadStatus(conv.leads?.status, ["perdido", "perdida"]);
        case "no_show":
          return (
            conv.contact_type === "lead" &&
            matchesLeadStatus(conv.leads?.status, ["faltou", "no_show", "cancel", "cancelad", "cance"])
          );
        case "alert":
          return conv.contact_type === "lead" && (conv.leads?.no_show_count ?? 0) > 0;
        case "all":
        default:
          return true;
      }
    });

    if (!query) return statusFiltered;

    return statusFiltered.filter((conv) => {
      const name = getContactName(conv).toLowerCase();
      const phone = conv.phone.toLowerCase();
      return name.includes(query) || phone.includes(query);
    });
  }, [conversations, searchQuery, statusFilter]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Conversas
        </h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar conversas..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs value={statusFilter} onValueChange={onStatusFilterChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="open">Abertas</TabsTrigger>
            <TabsTrigger value="patient">Paciente</TabsTrigger>
            <TabsTrigger value="scheduled">Agendado</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-3 mt-2">
            <TabsTrigger value="lost">Perdido</TabsTrigger>
            <TabsTrigger value="no_show">Faltou/Cancelou</TabsTrigger>
            <TabsTrigger value="alert">Alerta</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-2 mt-2">
            <TabsTrigger value="resolved">Resolvidas</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Carregando...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Nenhuma conversa encontrada</div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'w-full p-4 text-left hover:bg-accent transition-colors',
                  selectedId === conv.id && 'bg-accent'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold truncate">{getContactName(conv)}</p>
                  {conv.unread_count > 0 && (
                    <Badge variant="default" className="rounded-full px-2 py-0.5 text-xs">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground truncate mb-1">{conv.phone}</p>

                {conv.last_message_at && (
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.last_message_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
