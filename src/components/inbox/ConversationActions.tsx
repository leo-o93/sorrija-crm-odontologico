import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUpdateConversation } from '@/hooks/useConversations';
import { CheckCircle, Archive, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface ConversationActionsProps {
  conversationId: string;
  currentStatus: string;
  unreadCount: number;
}

export function ConversationActions({ 
  conversationId, 
  currentStatus, 
  unreadCount 
}: ConversationActionsProps) {
  const updateConversation = useUpdateConversation();

  const handleStatusChange = async (newStatus: string) => {
    await updateConversation.mutateAsync({
      conversationId,
      updates: { status: newStatus as any },
    });
    toast.success('Status da conversa atualizado!');
  };

  const handleResolve = async () => {
    await updateConversation.mutateAsync({
      conversationId,
      updates: { status: 'resolved', unread_count: 0 },
    });
    toast.success('Conversa resolvida!');
  };

  const handleArchive = async () => {
    await updateConversation.mutateAsync({
      conversationId,
      updates: { status: 'archived' },
    });
    toast.success('Conversa arquivada!');
  };

  const statusColors = {
    open: 'bg-green-500/10 text-green-500 border-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    resolved: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    archived: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  const statusLabels = {
    open: 'Aberta',
    pending: 'Pendente',
    resolved: 'Resolvida',
    archived: 'Arquivada',
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Status da Conversa</label>
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Aberta</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="resolved">Resolvida</SelectItem>
            <SelectItem value="archived">Arquivada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className={statusColors[currentStatus as keyof typeof statusColors]}>
          {statusLabels[currentStatus as keyof typeof statusLabels]}
        </Badge>
        {unreadCount > 0 && (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <MessageSquare className="w-3 h-3 mr-1" />
            {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        {currentStatus !== 'resolved' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResolve}
            className="flex-1"
            disabled={updateConversation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Resolver
          </Button>
        )}
        {currentStatus !== 'archived' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            className="flex-1"
            disabled={updateConversation.isPending}
          >
            <Archive className="w-4 h-4 mr-1" />
            Arquivar
          </Button>
        )}
      </div>
    </div>
  );
}
