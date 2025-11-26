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
    const { phone, limit = 50 } = await req.json();

    if (!phone) {
      throw new Error('Phone number is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar configuração da Evolution API
    const { data: config, error: configError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'whatsapp_evolution')
      .eq('active', true)
      .single();

    if (configError || !config) {
      throw new Error('Evolution API não configurada');
    }

    const settings = config.settings as any;
    const cleanUrl = settings.evolution_base_url.replace(/\/manager\/?$/, '');

    console.log(`Fetching message history for ${phone}...`);

    // Buscar histórico de mensagens da Evolution API
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

    // Buscar ou criar conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('phone', phone)
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
        })
        .select('id')
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
