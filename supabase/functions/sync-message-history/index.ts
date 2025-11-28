import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

          const messages = await response.json();
          
          if (messages.length > 0) {
            const messagesToInsert = messages.map((msg: any) => ({
              conversation_id: conv.id,
              direction: msg.key.fromMe ? 'outgoing' : 'incoming',
              type: msg.message?.conversation ? 'text' : 'media',
              content_text: msg.message?.conversation || msg.message?.extendedTextMessage?.text,
              provider_message_id: msg.key.id,
              status: 'received',
              created_at: new Date(msg.messageTimestamp * 1000).toISOString(),
              raw_payload: msg,
              organization_id: conv.organization_id,
            }));

            const { error: insertError } = await supabase
              .from('messages')
              .upsert(messagesToInsert, {
                onConflict: 'provider_message_id',
                ignoreDuplicates: true,
              });

            if (insertError) {
              console.error(`Error inserting messages for ${conv.phone}:`, insertError);
              results.push({ phone: conv.phone, success: false, error: insertError.message });
            } else {
              totalSynced += messages.length;
              results.push({ phone: conv.phone, success: true, synced: messages.length });
            }
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

    const messages = await response.json();
    console.log(`Found ${messages.length} messages`);

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

    // Inserir mensagens no banco de dados
    if (messages.length > 0 && conversationId) {
      const messagesToInsert = messages.map((msg: any) => ({
        conversation_id: conversationId,
        direction: msg.key.fromMe ? 'outgoing' : 'incoming',
        type: msg.message?.conversation ? 'text' : 'media',
        content_text: msg.message?.conversation || msg.message?.extendedTextMessage?.text,
        provider_message_id: msg.key.id,
        status: 'received',
        created_at: new Date(msg.messageTimestamp * 1000).toISOString(),
        raw_payload: msg,
        organization_id: conversation?.organization_id || organizationId,
      }));

      const { error: insertError } = await supabase
        .from('messages')
        .upsert(messagesToInsert, {
          onConflict: 'provider_message_id',
          ignoreDuplicates: true,
        });

      if (insertError) {
        console.error('Error inserting messages:', insertError);
        throw insertError;
      }
    }

    console.log(`Successfully synced ${messages.length} messages`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: messages.length,
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
