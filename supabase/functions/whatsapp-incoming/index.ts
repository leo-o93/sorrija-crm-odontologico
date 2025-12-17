import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key?: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
      senderPn?: string;
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
    messageTimestamp?: number;
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

    // Filtrar apenas eventos de mensagens novas
    const supportedEvents = ['messages.upsert'];
    if (!supportedEvents.includes(payload.event)) {
      console.log(`Ignoring event type: ${payload.event}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Event ${payload.event} ignored - only processing messages.upsert` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar estrutura do payload
    if (!payload.data?.key) {
      console.log('Missing data.key in payload, skipping');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Invalid payload structure - missing data.key' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const instanceName = payload.instance;
    console.log('Looking for integration with instance:', instanceName);

    // Buscar todas as configurações ativas
    const { data: allSettings, error: integrationError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'whatsapp_evolution')
      .eq('active', true);

    if (integrationError || !allSettings || allSettings.length === 0) {
      console.error('No integrations found:', integrationError);
      return new Response(
        JSON.stringify({ error: 'Integration not configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encontrar a configuração específica para esta instância
    const integrationSettings = allSettings.find(
      s => s.settings?.evolution_instance === instanceName
    );

    if (!integrationSettings) {
      console.error('Integration not found for instance:', instanceName);
      console.error('Available instances:', allSettings.map(s => s.settings?.evolution_instance));
      return new Response(
        JSON.stringify({ error: `Integration not configured for instance: ${instanceName}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar o organization_id diretamente da configuração
    const organizationId = integrationSettings.organization_id;
    console.log('Using organization from integration:', organizationId);

    // Validar webhook token
    const storedToken = integrationSettings.settings?.webhook_secret;
    if (storedToken !== webhookToken) {
      console.error('Invalid webhook token for instance:', instanceName);
      console.error('Expected token:', storedToken?.substring(0, 10) + '...');
      console.error('Received token:', webhookToken.substring(0, 10) + '...');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine message direction
    const isFromMe = payload.data.key.fromMe;
    const direction = isFromMe ? 'out' : 'in';
    console.log('Message direction:', direction);

    // Extract phone number - pode vir em senderPn (número real) ou remoteJid
    // O remoteJid pode ser @lid (Lead ID interno) que NÃO é um número de telefone
    const remoteJid = payload.data.key.remoteJid;
    const senderPn = payload.data.key.senderPn;

    let phoneSource: string | null = null;

    // Prioridade 1: usar senderPn se disponível (contém o número real)
    if (senderPn && senderPn.includes('@s.whatsapp.net')) {
      phoneSource = senderPn.replace('@s.whatsapp.net', '');
      console.log('Using senderPn for phone:', phoneSource);
    }
    // Prioridade 2: usar remoteJid se for um número real (@s.whatsapp.net)
    else if (remoteJid.includes('@s.whatsapp.net')) {
      phoneSource = remoteJid.replace('@s.whatsapp.net', '');
      console.log('Using remoteJid for phone:', phoneSource);
    }
    // Se for @lid, não temos o número real
    else if (remoteJid.includes('@lid')) {
      console.log('Received @lid identifier without senderPn, cannot extract phone number');
      console.log('remoteJid:', remoteJid);
      console.log('Full payload:', JSON.stringify(payload, null, 2));
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Cannot process @lid without senderPn - phone number not available' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // Fallback
    else {
      phoneSource = remoteJid.replace(/@.*$/, '');
      console.log('Using fallback for phone:', phoneSource);
    }

    // Normalize phone number
    const normalizedPhone = phoneSource.replace(/\D/g, '');
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
      .eq('organization_id', organizationId)
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
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existingPatient) {
        contactId = existingPatient.id;
        contactType = 'patient';
        console.log('Found existing patient:', contactId);
      } else {
        // Create new lead
        // Se a mensagem é "from me" (enviada pela clínica), o pushName é o nome da clínica
        // Nesse caso, usamos o número de telefone formatado como nome do contato
        // Se a mensagem é recebida (from me = false), podemos usar o pushName do contato
        const contactName = isFromMe 
          ? `Contato ${phoneWithCountry.slice(-4)}`
          : (payload.data.pushName || `Contato ${phoneWithCountry.slice(-4)}`);
        
        console.log('Creating new lead with name:', contactName, 'fromMe:', isFromMe);
        
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            name: contactName,
            phone: phoneWithCountry,
            source_id: null,
            status: 'novo_lead',
            notes: 'Contato iniciado via WhatsApp',
            organization_id: organizationId,
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
      .eq('organization_id', organizationId)
      .maybeSingle();

    let conversationId: string;

    if (existingConversation) {
      conversationId = existingConversation.id;
      console.log('Found existing conversation:', conversationId);
      
      // Update conversation (only increment unread_count for incoming messages)
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: direction === 'in' 
            ? (existingConversation.unread_count || 0) + 1 
            : existingConversation.unread_count,
        })
        .eq('id', conversationId);

      if (updateError) {
        console.error('Error updating conversation:', updateError);
      }
    } else {
      // Create new conversation (only set unread_count for incoming messages)
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
          unread_count: direction === 'in' ? 1 : 0,
          organization_id: organizationId,
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
        direction: direction,
        type: messageType,
        content_text: messageText || null,
        media_url: mediaUrl,
        status: direction === 'in' ? 'received' : 'sent',
        provider_message_id: payload.data.key.id,
        raw_payload: payload,
        organization_id: organizationId,
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