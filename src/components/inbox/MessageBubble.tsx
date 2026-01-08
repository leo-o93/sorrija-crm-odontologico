import { Message } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, FileText, Download } from 'lucide-react';
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

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return message.content_text && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content_text}</p>
        );

      case 'image':
        return message.media_url && (
          <div className="space-y-1">
            <img 
              src={message.media_url} 
              alt="Imagem" 
              className="rounded max-w-full cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.media_url!, '_blank')}
            />
            {message.content_text && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content_text}</p>
            )}
          </div>
        );

      case 'video':
        return message.media_url && (
          <div className="space-y-1">
            <video 
              controls 
              className="rounded max-w-full max-h-64"
              preload="metadata"
            >
              <source src={message.media_url} />
              Seu navegador não suporta vídeo.
            </video>
            {message.content_text && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content_text}</p>
            )}
          </div>
        );

      case 'audio':
        return message.media_url && (
          <audio 
            controls 
            className="max-w-full min-w-[200px]"
            preload="metadata"
          >
            <source src={message.media_url} type="audio/ogg" />
            <source src={message.media_url} type="audio/mpeg" />
            Seu navegador não suporta áudio.
          </audio>
        );

      case 'document':
        return message.media_url && (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-colors",
              isOutgoing 
                ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" 
                : "bg-background/50 hover:bg-background/70"
            )}
          >
            <FileText className="w-8 h-8 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.content_text || 'Documento'}
              </p>
              <p className="text-xs opacity-70">Clique para abrir</p>
            </div>
            <Download className="w-4 h-4 flex-shrink-0" />
          </a>
        );

      default:
        return message.content_text && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content_text}</p>
        );
    }
  };

  return (
    <div className={cn('flex', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-lg p-3 space-y-1',
          isOutgoing ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {renderContent()}

        <div className="flex items-center gap-2 justify-end text-xs opacity-70">
          <span>{format(new Date(message.created_at), 'HH:mm')}</span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
}
