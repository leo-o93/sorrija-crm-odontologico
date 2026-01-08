-- Remover o índice parcial existente
DROP INDEX IF EXISTS messages_provider_message_id_unique;

-- Criar constraint UNIQUE completa (permite NULL, mas não duplicados)
ALTER TABLE public.messages
ADD CONSTRAINT messages_provider_message_id_key UNIQUE (provider_message_id);