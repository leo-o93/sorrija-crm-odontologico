import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useSendMessage } from '@/hooks/useMessages';

interface MessageInputProps {
  conversationId: string;
  phone: string;
  leadId?: string;
  patientId?: string;
}

export function MessageInput({ conversationId, phone, leadId, patientId }: MessageInputProps) {
  const [text, setText] = useState('');
  const sendMessage = useSendMessage();

  const handleSend = async () => {
    if (!text.trim()) return;

    await sendMessage.mutateAsync({
      conversationId,
      phone,
      leadId,
      patientId,
      type: 'text',
      text: text.trim(),
    });

    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite sua mensagem..."
        className="resize-none"
        rows={2}
      />
      <Button
        onClick={handleSend}
        disabled={!text.trim() || sendMessage.isPending}
        size="icon"
        className="self-end"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
