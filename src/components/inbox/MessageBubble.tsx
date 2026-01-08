import { useState, useEffect, useRef } from 'react';
import { Message } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, FileText, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.direction === 'out';
  const [mediaUrl, setMediaUrl] = useState(message.media_url);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [mediaExpired, setMediaExpired] = useState(false);
  const proxyAttempted = useRef(false);

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

  const handleMediaError = async () => {
    // Prevent multiple proxy attempts
    if (proxyAttempted.current || isLoadingMedia || mediaError || mediaExpired) {
      if (!mediaExpired && !mediaError) setMediaError(true);
      return;
    }

    // Only try proxy if URL is from WhatsApp's temporary CDN
    if (!mediaUrl?.includes('mmg.whatsapp.net')) {
      setMediaError(true);
      return;
    }

    proxyAttempted.current = true;
    setIsLoadingMedia(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMediaError(true);
        setIsLoadingMedia(false);
        return;
      }

      const response = await supabase.functions.invoke('media-proxy', {
        body: { message_id: message.id },
      });

      // Check for error in response (including HTTP errors)
      if (response.error) {
        // Parse error body to check for media_expired
        const errorBody = String(response.error.message || response.error || '');
        const isExpired = errorBody.includes('media_expired') || 
                          errorBody.includes('410') || 
                          errorBody.includes('expirada') ||
                          errorBody.includes('403');
        
        if (isExpired) {
          setMediaExpired(true);
          setMediaError(false);
        } else {
          setMediaError(true);
        }
        setIsLoadingMedia(false);
        return;
      }

      if (response.data?.url) {
        setMediaUrl(response.data.url);
        setMediaError(false);
        setMediaExpired(false);
      } else if (response.data?.error === 'media_expired') {
        setMediaExpired(true);
        setMediaError(false);
      } else {
        setMediaError(true);
      }
    } catch (error: unknown) {
      // Handle any thrown errors - including FunctionsHttpError from SDK
      console.warn('Media proxy error:', error);
      
      // Try to extract error info from various error formats
      let errorInfo = '';
      if (error instanceof Error) {
        errorInfo = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorInfo = JSON.stringify(error);
      } else {
        errorInfo = String(error);
      }
      
      // Check if error indicates media expired
      const isExpired = errorInfo.includes('media_expired') || 
                        errorInfo.includes('410') || 
                        errorInfo.includes('expirada') ||
                        errorInfo.includes('403');
      
      if (isExpired) {
        setMediaExpired(true);
        setMediaError(false);
      } else {
        setMediaError(true);
      }
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const renderMediaExpired = (type: string) => (
    <div className="p-4 bg-muted/50 rounded-lg text-center space-y-1">
      <p className="text-sm text-muted-foreground">
        {type === 'image' ? '📷' : type === 'video' ? '🎬' : '🎵'} Mídia expirada
      </p>
      <p className="text-xs text-muted-foreground/70">
        O WhatsApp remove mídias após ~48h
      </p>
    </div>
  );

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return message.content_text && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content_text}</p>
        );

      case 'image':
        if (isLoadingMedia) {
          return (
            <div className="space-y-1">
              <Skeleton className="w-48 h-48 rounded" />
              <div className="flex items-center gap-2 text-xs opacity-70">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Carregando imagem...</span>
              </div>
            </div>
          );
        }
        
        if (mediaExpired) {
          return renderMediaExpired('image');
        }
        
        if (mediaError || !mediaUrl) {
          return (
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Imagem indisponível</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-1">
            <img 
              src={mediaUrl} 
              alt="Imagem" 
              className="rounded max-w-full cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(mediaUrl, '_blank')}
              onError={handleMediaError}
            />
            {message.content_text && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content_text}</p>
            )}
          </div>
        );

      case 'video':
        if (isLoadingMedia) {
          return (
            <div className="space-y-1">
              <Skeleton className="w-64 h-36 rounded" />
              <div className="flex items-center gap-2 text-xs opacity-70">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Carregando vídeo...</span>
              </div>
            </div>
          );
        }
        
        if (mediaExpired) {
          return renderMediaExpired('video');
        }
        
        if (mediaError || !mediaUrl) {
          return (
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Vídeo indisponível</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-1">
            <video 
              controls 
              className="rounded max-w-full max-h-64"
              preload="metadata"
              onError={handleMediaError}
            >
              <source src={mediaUrl} />
              Seu navegador não suporta vídeo.
            </video>
            {message.content_text && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content_text}</p>
            )}
          </div>
        );

      case 'audio':
        if (isLoadingMedia) {
          return (
            <div className="flex items-center gap-2 p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Carregando áudio...</span>
            </div>
          );
        }
        
        if (mediaExpired) {
          return renderMediaExpired('audio');
        }
        
        if (mediaError || !mediaUrl) {
          return (
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Áudio indisponível</p>
            </div>
          );
        }
        
        return (
          <audio 
            controls 
            className="max-w-full min-w-[200px]"
            preload="metadata"
            onError={handleMediaError}
          >
            <source src={mediaUrl} type="audio/ogg" />
            <source src={mediaUrl} type="audio/mpeg" />
            Seu navegador não suporta áudio.
          </audio>
        );

      case 'document':
        if (!message.media_url) {
          return (
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Documento indisponível</p>
            </div>
          );
        }
        return (
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
