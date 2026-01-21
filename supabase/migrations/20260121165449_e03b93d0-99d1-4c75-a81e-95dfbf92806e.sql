-- Limpar mapeamentos incorretos no lid_phone_mapping
-- Estes mapeamentos estão apontando para o número da própria conta WhatsApp da organização
-- em vez dos números dos contatos reais

-- Remover mapeamento específico do número que foi identificado como incorreto
DELETE FROM lid_phone_mapping 
WHERE phone = '553193139078';

-- Log de quantos registros foram afetados (não há RAISE NOTICE em Supabase, mas a query acima retorna count)
-- Após esta limpeza, novos mapeamentos só serão criados corretamente a partir de mensagens INBOUND