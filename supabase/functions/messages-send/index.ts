import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessagePayload {
  conversation_id?: string;
  lead_id?: string;
  patient_id?: string;
  phone: string;
  type: string;
  text?: string;
  media?: string;
  metadata?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: SendMessagePayload = await req.json();
    console.log('Send message request:', payload);

    // Get integration settings (single clinic setup - no organizations)
    const { data: integrationSettings } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'whatsapp_evolution')
      .eq('active', true)
      .single();

    if (!integrationSettings || !integrationSettings.settings?.n8n_outgoing_url) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp integration not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone
    const normalizedPhone = payload.phone.replace(/\D/g, '');
    const phoneWithCountry = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;

    let conversationId = payload.conversation_id;

    // Find or create conversation
    if (!conversationId) {
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('phone', phoneWithCountry)
        .eq('channel', 'whatsapp')
        .maybeSingle();

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create new conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            contact_type: payload.lead_id ? 'lead' : 'patient',
            lead_id: payload.lead_id || null,
            patient_id: payload.patient_id || null,
            channel: 'whatsapp',
            evolution_instance: integrationSettings.settings?.evolution_instance,
            phone: phoneWithCountry,
            status: 'open',
            assigned_user_id: user.id,
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (convError) {
          console.error('Error creating conversation:', convError);
          throw convError;
        }

        conversationId = newConversation.id;
      }
    }

    // Create message in database
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        direction: 'out',
        type: payload.type,
        content_text: payload.text || null,
        media_url: payload.media || null,
        status: 'queued',
        created_by_user_id: user.id,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      throw messageError;
    }

    // Send to n8n webhook
    const n8nWebhookUrl = integrationSettings.settings.n8n_outgoing_url;
    const n8nPayload = {
      conversation_id: conversationId,
      local_message_id: newMessage.id,
      phone: phoneWithCountry,
      type: payload.type,
      text: payload.text,
      media: payload.media,
      instance: integrationSettings.settings?.evolution_instance,
      metadata: payload.metadata,
    };

    console.log('Sending to n8n:', n8nWebhookUrl);
    
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      console.error('n8n webhook failed:', await n8nResponse.text());
      
      // Update message status to failed
      await supabase
        .from('messages')
        .update({ status: 'failed' })
        .eq('id', newMessage.id);

      throw new Error('Failed to send message via n8n');
    }

    const n8nResult = await n8nResponse.json();
    console.log('n8n response:', n8nResult);

    // Update message with provider ID and status
    const { data: updatedMessage } = await supabase
      .from('messages')
      .update({
        provider_message_id: n8nResult.message_id || n8nResult.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', newMessage.id)
      .select()
      .single();

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return new Response(
      JSON.stringify({
        success: true,
        message: updatedMessage || newMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
