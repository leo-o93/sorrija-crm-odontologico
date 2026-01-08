import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper para extrair array de mensagens do formato variável da Evolution API
const extractMessages = (response: any): any[] => {
  if (Array.isArray(response)) {
    return response;
  }
  
  if (response && typeof response === 'object') {
    // Estrutura: { messages: { records: [...] } }
    if (response.messages?.records && Array.isArray(response.messages.records)) {
      return response.messages.records;
    }
    // Estrutura: { messages: [...] }
    if (Array.isArray(response.messages)) return response.messages;
    // Estrutura: { data: [...] }
    if (Array.isArray(response.data)) return response.data;
    // Estrutura: { records: [...] }
    if (Array.isArray(response.records)) return response.records;
  }
  
  console.warn('Could not extract messages from response:', JSON.stringify(response).slice(0, 500));
  return [];
};

const mapMessagePayload = (msg: any) => {
  const direction = msg.key?.fromMe ? 'out' : 'in';
  let type = 'text';
  let contentText: string | null = null;
  let mediaUrl: string | null = null;

  if (msg.message?.conversation) {
    contentText = msg.message.conversation;
  } else if (msg.message?.extendedTextMessage?.text) {
    contentText = msg.message.extendedTextMessage.text;
  } else if (msg.message?.imageMessage) {
    type = 'image';
    mediaUrl = msg.message.imageMessage.url || null;
    contentText = msg.message.imageMessage.caption || null;
  } else if (msg.message?.videoMessage) {
    type = 'video';
    mediaUrl = msg.message.videoMessage.url || null;
    contentText = msg.message.videoMessage.caption || null;
  } else if (msg.message?.audioMessage) {
    type = 'audio';
    mediaUrl = msg.message.audioMessage.url || null;
  } else if (msg.message?.documentMessage) {
    type = 'document';
    mediaUrl = msg.message.documentMessage.url || null;
    contentText = msg.message.documentMessage.fileName || null;
  }

  return {
    direction,
    type,
    content_text: contentText,
    media_url: mediaUrl,
    status: direction === 'out' ? 'sent' : 'received',
    created_at: new Date((msg.messageTimestamp ?? 0) * 1000).toISOString(),
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, limit = 50, syncAll = false } = await req.json();

    if (!syncAll && !phone) {
      throw new Error('Phone number is required when syncAll is false');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar configuração da Evolution API (mais recente)
    const { data: config, error: configError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'whatsapp_evolution')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching config:', configError);
      throw new Error(`Erro ao buscar configuração: ${configError.message}`);
    }

    if (!config) {
      throw new Error('Evolution API não configurada');
    }

    const settings = config.settings as any;
    const cleanUrl = settings.evolution_base_url.replace(/\/manager\/?$/, '');

    // Se syncAll for true, buscar todas as conversas da instância atual
    if (syncAll) {
      console.log('Syncing all conversations for instance...');
      
      const { data: conversations, error: convListError } = await supabase
        .from('conversations')
        .select('phone, id, evolution_instance, organization_id')
        .eq('evolution_instance', settings.evolution_instance);

      if (convListError) throw convListError;

      if (!conversations || conversations.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            synced: 0,
            total_conversations: 0,
            message: 'Nenhuma conversa encontrada para sincronizar'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      let totalSynced = 0;
      const results = [];

      for (const conv of conversations) {
        try {
          const remotePhone = conv.phone.includes('@') ? conv.phone : `${conv.phone}@s.whatsapp.net`;
          
          const response = await fetch(
            `${cleanUrl}/chat/findMessages/${settings.evolution_instance}`,
            {
              method: 'POST',
              headers: {
                'apikey': settings.evolution_api_key,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                where: {
                  key: {
                    remoteJid: remotePhone,
                  },
                },
                limit: limit,
              }),
            }
          );

          if (!response.ok) {
            console.error(`Failed to sync ${conv.phone}: ${response.statusText}`);
            results.push({ phone: conv.phone, success: false, error: response.statusText });
            continue;
          }

          const responseData = await response.json();
          const messages = extractMessages(responseData);
          console.log(`[${conv.phone}] Extracted ${messages.length} messages from response`);
          
          if (messages.length > 0) {
            const messagesToInsert = messages.map((msg: any) => ({
              conversation_id: conv.id,
              ...mapMessagePayload(msg),
              provider_message_id: msg.key.id,
              raw_payload: msg,
              organization_id: conv.organization_id,
            }));

            // Tentar upsert primeiro
            const { error: upsertError } = await supabase
              .from('messages')
              .upsert(messagesToInsert, {
                onConflict: 'provider_message_id',
                ignoreDuplicates: true,
              });

            if (upsertError) {
              console.warn(`Upsert failed for ${conv.phone}, trying individual inserts:`, upsertError.message);
              
              // Fallback: inserir individualmente ignorando duplicados
              let successCount = 0;
              for (const msg of messagesToInsert) {
                const { error: singleError } = await supabase
                  .from('messages')
                  .upsert(msg, {
                    onConflict: 'provider_message_id',
                    ignoreDuplicates: true,
                  });
                
                if (!singleError) {
                  successCount++;
                } else if (!singleError.message.includes('duplicate')) {
                  console.error('Error inserting single message:', singleError);
                }
              }
              console.log(`Individual insert: ${successCount}/${messagesToInsert.length} messages`);
            }

            // Atualizar last_message_at
            const latestMessageTimestamp = Math.max(
              ...messages.map((msg: any) => (msg.messageTimestamp ?? 0) * 1000)
            );

            if (latestMessageTimestamp > 0) {
              const latestMessageDate = new Date(latestMessageTimestamp).toISOString();
              await supabase
                .from('conversations')
                .update({ last_message_at: latestMessageDate })
                .eq('id', conv.id);
            }

            totalSynced += messages.length;
            results.push({ phone: conv.phone, success: true, synced: messages.length });
          } else {
            results.push({ phone: conv.phone, success: true, synced: 0 });
          }
        } catch (error) {
          console.error(`Error processing ${conv.phone}:`, error);
          results.push({ phone: conv.phone, success: false, error: String(error) });
        }
      }

      console.log(`Bulk sync complete. Total messages: ${totalSynced}`);

      return new Response(
        JSON.stringify({
          success: true,
          total_synced: totalSynced,
          total_conversations: conversations.length,
          results: results,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Sincronização individual (código original)
    console.log(`Fetching message history for ${phone}...`);

    const remotePhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    
    const response = await fetch(
      `${cleanUrl}/chat/findMessages/${settings.evolution_instance}`,
      {
        method: 'POST',
        headers: {
          'apikey': settings.evolution_api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          where: {
            key: {
              remoteJid: remotePhone,
            },
          },
          limit: limit,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`);
    }

    const responseData = await response.json();
    const messages = extractMessages(responseData);
    console.log(`Found ${messages.length} messages for ${phone}`);

    // Find organization for this instance
    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('evolution_instance', settings.evolution_instance)
      .single();

    const organizationId = organization?.id;

    // Buscar ou criar conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, organization_id')
      .eq('phone', phone)
      .eq('organization_id', organizationId || '')
      .maybeSingle();

    let conversationId = conversation?.id;

    if (!conversation) {
      // Criar nova conversa
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          phone: phone,
          channel: 'whatsapp',
          contact_type: 'lead',
          evolution_instance: settings.evolution_instance,
          status: 'open',
          organization_id: organizationId,
        })
        .select('id, organization_id')
        .single();

      if (createError) throw createError;
      conversationId = newConv.id;
    }

    // Inserir mensagens no banco de dados e contar apenas as novas
    let newMessagesCount = 0;
    
    if (messages.length > 0 && conversationId) {
      const messagesToInsert = messages.map((msg: any) => ({
        conversation_id: conversationId,
        ...mapMessagePayload(msg),
        provider_message_id: msg.key.id,
        raw_payload: msg,
        organization_id: conversation?.organization_id || organizationId,
      }));

      // Inserir individualmente para rastrear quantas são realmente novas
      for (const msg of messagesToInsert) {
        const { data: inserted, error: insertError } = await supabase
          .from('messages')
          .upsert(msg, {
            onConflict: 'provider_message_id',
            ignoreDuplicates: true,
          })
          .select('id, created_at, updated_at')
          .maybeSingle();
        
        if (insertError) {
          // Ignorar erros de duplicata
          if (!insertError.message.includes('duplicate')) {
            console.error('Error inserting message:', insertError);
          }
          continue;
        }
        
        // Verificar se foi insert (novo) ou update (existente)
        // Se created_at e updated_at são aproximadamente iguais (< 2s), é novo
        if (inserted) {
          const created = new Date(inserted.created_at).getTime();
          const updated = new Date(inserted.updated_at).getTime();
          if (Math.abs(created - updated) < 2000) {
            newMessagesCount++;
          }
        }
      }

      const latestMessageTimestamp = Math.max(
        ...messages.map((msg: any) => (msg.messageTimestamp ?? 0) * 1000)
      );

      if (latestMessageTimestamp > 0) {
        const latestMessageDate = new Date(latestMessageTimestamp).toISOString();
        await supabase
          .from('conversations')
          .update({ last_message_at: latestMessageDate })
          .eq('id', conversationId);
      }
    }

    console.log(`Synced: ${newMessagesCount} new messages (fetched ${messages.length} total)`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: newMessagesCount,
        total_fetched: messages.length,
        conversation_id: conversationId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error syncing message history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
