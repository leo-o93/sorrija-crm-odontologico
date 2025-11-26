import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        url: string;
        caption?: string;
      };
      videoMessage?: {
        url: string;
        caption?: string;
      };
      audioMessage?: {
        url: string;
      };
      documentMessage?: {
        url: string;
        fileName?: string;
      };
    };
    messageType?: string;
    messageTimestamp: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookToken = req.headers.get('x-webhook-token');
    
    if (!webhookToken) {
      console.error('Missing webhook token');
      return new Response(
        JSON.stringify({ error: 'Missing webhook token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: EvolutionWebhookPayload = await req.json();
    console.log('Received Evolution webhook:', JSON.stringify(payload, null, 2));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find integration by instance
    const { data: integrationSettings, error: integrationError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'whatsapp_evolution')
      .eq('active', true)
      .maybeSingle();

    if (integrationError || !integrationSettings) {
      console.error('Integration not found:', integrationError);
      return new Response(
        JSON.stringify({ error: 'Integration not configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate webhook token
    const storedToken = integrationSettings.settings?.webhook_secret;
    if (storedToken !== webhookToken) {
      console.error('Invalid webhook token');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only process incoming messages (not from us)
    if (payload.data.key.fromMe) {
      console.log('Ignoring message from self');
      return new Response(
        JSON.stringify({ success: true, message: 'Ignored message from self' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract phone number (remove @s.whatsapp.net suffix)
    const remoteJid = payload.data.key.remoteJid;
    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '');
    
    // Normalize phone number
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    const phoneWithCountry = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;

    console.log('Processing message from:', phoneWithCountry);

    // Extract message content
    let messageText = '';
    let mediaUrl = null;
    let messageType = 'text';

    if (payload.data.message?.conversation) {
      messageText = payload.data.message.conversation;
    } else if (payload.data.message?.extendedTextMessage?.text) {
      messageText = payload.data.message.extendedTextMessage.text;
    } else if (payload.data.message?.imageMessage) {
      messageType = 'image';
      mediaUrl = payload.data.message.imageMessage.url;
      messageText = payload.data.message.imageMessage.caption || '';
    } else if (payload.data.message?.videoMessage) {
      messageType = 'video';
      mediaUrl = payload.data.message.videoMessage.url;
      messageText = payload.data.message.videoMessage.caption || '';
    } else if (payload.data.message?.audioMessage) {
      messageType = 'audio';
      mediaUrl = payload.data.message.audioMessage.url;
    } else if (payload.data.message?.documentMessage) {
      messageType = 'document';
      mediaUrl = payload.data.message.documentMessage.url;
      messageText = payload.data.message.documentMessage.fileName || '';
    }

    console.log('Message content:', { messageType, messageText, mediaUrl });

    // Find or create lead by phone
    let contactId: string | null = null;
    let contactType: 'lead' | 'patient' = 'lead';

    // Try to find existing lead
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phoneWithCountry)
      .maybeSingle();

    if (existingLead) {
      contactId = existingLead.id;
      contactType = 'lead';
      console.log('Found existing lead:', contactId);
    } else {
      // Try to find existing patient
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', phoneWithCountry)
        .maybeSingle();

      if (existingPatient) {
        contactId = existingPatient.id;
        contactType = 'patient';
        console.log('Found existing patient:', contactId);
      } else {
        // Create new lead
        const contactName = payload.data.pushName || 'Contato WhatsApp';
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            name: contactName,
            phone: phoneWithCountry,
            source_id: null,
            status: 'novo_lead',
            notes: 'Contato iniciado via WhatsApp',
          })
          .select()
          .single();

        if (leadError) {
          console.error('Error creating lead:', leadError);
          throw leadError;
        }

        contactId = newLead.id;
        contactType = 'lead';
        console.log('Created new lead:', contactId);
      }
    }

    // Find or create conversation
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id, unread_count')
      .eq('phone', phoneWithCountry)
      .eq('channel', 'whatsapp')
      .maybeSingle();

    let conversationId: string;

    if (existingConversation) {
      conversationId = existingConversation.id;
      console.log('Found existing conversation:', conversationId);
      
      // Update conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: (existingConversation.unread_count || 0) + 1,
        })
        .eq('id', conversationId);

      if (updateError) {
        console.error('Error updating conversation:', updateError);
      }
    } else {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          contact_type: contactType,
          lead_id: contactType === 'lead' ? contactId : null,
          patient_id: contactType === 'patient' ? contactId : null,
          channel: 'whatsapp',
          evolution_instance: payload.instance,
          phone: phoneWithCountry,
          status: 'open',
          last_message_at: new Date().toISOString(),
          unread_count: 1,
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw convError;
      }

      conversationId = newConversation.id;
      console.log('Created new conversation:', conversationId);
    }

    // Create message
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        direction: 'in',
        type: messageType,
        content_text: messageText || null,
        media_url: mediaUrl,
        status: 'received',
        provider_message_id: payload.data.key.id,
        raw_payload: payload,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      throw messageError;
    }

    console.log('Message processed successfully:', newMessage.id);

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conversationId,
        lead_id: contactType === 'lead' ? contactId : null,
        patient_id: contactType === 'patient' ? contactId : null,
        message_id: newMessage.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});