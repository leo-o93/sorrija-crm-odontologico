-- Trigger para atualizar last_message_at automaticamente quando mensagem é inserida
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS on_message_insert_update_conversation ON messages;
CREATE TRIGGER on_message_insert_update_conversation
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();

-- Corrigir dados existentes: sincronizar last_message_at com a última mensagem real
UPDATE conversations c
SET last_message_at = subq.max_created_at,
    updated_at = NOW()
FROM (
  SELECT conversation_id, MAX(created_at) as max_created_at
  FROM messages
  GROUP BY conversation_id
) subq
WHERE c.id = subq.conversation_id
  AND (c.last_message_at IS NULL OR c.last_message_at < subq.max_created_at);