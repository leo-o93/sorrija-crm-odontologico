-- Primeiro, remover mensagens duplicadas mantendo apenas a mais recente de cada provider_message_id
DELETE FROM public.messages m1
WHERE m1.id NOT IN (
  SELECT DISTINCT ON (provider_message_id) id
  FROM public.messages
  WHERE provider_message_id IS NOT NULL
  ORDER BY provider_message_id, created_at DESC
)
AND m1.provider_message_id IS NOT NULL
AND m1.provider_message_id IN (
  SELECT provider_message_id
  FROM public.messages
  WHERE provider_message_id IS NOT NULL
  GROUP BY provider_message_id
  HAVING COUNT(*) > 1
);

-- Agora criar o índice único
CREATE UNIQUE INDEX IF NOT EXISTS messages_provider_message_id_unique 
ON public.messages (provider_message_id) 
WHERE provider_message_id IS NOT NULL;