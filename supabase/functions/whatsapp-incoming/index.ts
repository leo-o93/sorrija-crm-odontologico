import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

interface IncomingWebhookPayload {
  provider: string;
  instance: string;
  message_id: string;
  from: string;
  to: string;
  direction: string;
  type: string;
  text?: string;
  media?: string;
  timestamp: string;
  raw?: any;
  organization_slug?: string;
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

    const payload: IncomingWebhookPayload = await req.json();
    console.log('Received webhook payload:', payload);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find organization by slug or instance
    const { data: integrationSettings, error: integrationError } = await supabase
      .from('integration_settings')
      .select('*, organizations!inner(*)')
      .eq('integration_type', 'whatsapp_evolution')
      .or(`settings->evolution_instance.eq.${payload.instance}`)
      .single();

    if (integrationError || !integrationSettings) {
      console.error('Organization not found or integration not configured:', integrationError);
      return new Response(
        JSON.stringify({ error: 'Organization not found or integration not configured' }),
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

    const organizationId = integrationSettings.organization_id;
    
    // Normalize phone number
    const normalizedPhone = payload.from.replace(/\D/g, '');
    const phoneWithCountry = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;

    // Find or create lead/patient by phone
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
      } else {
        // Create new lead
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            name: 'Contato WhatsApp',
            phone: phoneWithCountry,
            organization_id: organizationId,
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
      }
    }

    // Find or create conversation
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('phone', phoneWithCountry)
      .eq('channel', 'whatsapp')
      .maybeSingle();

    let conversationId: string;

    if (existingConversation) {
      conversationId = existingConversation.id;
      
      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: supabase.rpc('increment', { x: 1 }) as any,
        })
        .eq('id', conversationId);
    } else {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          organization_id: organizationId,
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
    }

    // Create message
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        direction: 'in',
        type: payload.type || 'text',
        content_text: payload.text || null,
        media_url: payload.media || null,
        status: 'received',
        provider_message_id: payload.message_id,
        raw_payload: payload.raw || payload,
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
