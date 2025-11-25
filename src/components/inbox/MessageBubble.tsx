import { Message } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.direction === 'out';

  const getStatusIcon = () => {
    if (message.direction === 'in') return null;

    if (message.status === 'read') {
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
    }
    if (message.status === 'sent') {
      return <Check className="w-3 h-3 text-muted-foreground" />;
    }
    return null;
  };

  return (
    <div className={cn('flex', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-lg p-3 space-y-1',
          isOutgoing ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {message.type === 'text' && message.content_text && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content_text}</p>
        )}

        {message.type === 'image' && message.media_url && (
          <img src={message.media_url} alt="Imagem" className="rounded max-w-full" />
        )}

        <div className="flex items-center gap-2 justify-end text-xs opacity-70">
          <span>{format(new Date(message.created_at), 'HH:mm')}</span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
}
