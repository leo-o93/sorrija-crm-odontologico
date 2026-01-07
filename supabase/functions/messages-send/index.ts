import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessagePayload {
  organization_id: string;
  conversation_id?: string;
  lead_id?: string;
  patient_id?: string;
  phone: string;
  type: string;
  text?: string;
  media?: string;
  metadata?: unknown;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TEXT_LENGTH = 4096;
const MAX_PHONE_LENGTH = 20;

function validatePayload(data: unknown): SendMessagePayload {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }

  const { organization_id, conversation_id, lead_id, patient_id, phone, type, text, media, metadata } = data as Record<string, unknown>;

  // Validate organization_id
  if (typeof organization_id !== 'string' || !UUID_REGEX.test(organization_id)) {
    throw new Error('Valid organization_id is required');
  }

  // Validate optional UUIDs
  if (conversation_id !== undefined && (typeof conversation_id !== 'string' || !UUID_REGEX.test(conversation_id))) {
    throw new Error('Invalid conversation_id format');
  }
  if (lead_id !== undefined && lead_id !== null && (typeof lead_id !== 'string' || !UUID_REGEX.test(lead_id))) {
    throw new Error('Invalid lead_id format');
  }
  if (patient_id !== undefined && patient_id !== null && (typeof patient_id !== 'string' || !UUID_REGEX.test(patient_id))) {
    throw new Error('Invalid patient_id format');
  }

  // Validate phone
  if (typeof phone !== 'string' || !phone.trim()) {
    throw new Error('Phone number is required');
  }
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > MAX_PHONE_LENGTH) {
    throw new Error('Invalid phone number length');
  }

  // Validate type
  const validTypes = ['text', 'image', 'document', 'audio', 'video'];
  if (typeof type !== 'string' || !validTypes.includes(type)) {
    throw new Error(`Invalid message type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Validate text
  if (text !== undefined && text !== null) {
    if (typeof text !== 'string') {
      throw new Error('Text must be a string');
    }
    if (text.length > MAX_TEXT_LENGTH) {
      throw new Error(`Text must be less than ${MAX_TEXT_LENGTH} characters`);
    }
  }

  // Validate media URL if provided
  if (media !== undefined && media !== null) {
    if (typeof media !== 'string') {
      throw new Error('Media must be a URL string');
    }
    // Basic URL validation
    try {
      new URL(media);
    } catch {
      throw new Error('Invalid media URL');
    }
  }

  return {
    organization_id,
    conversation_id: conversation_id as string | undefined,
    lead_id: lead_id as string | undefined,
    patient_id: patient_id as string | undefined,
    phone: cleanPhone,
    type: type as string,
    text: text as string | undefined,
    media: media as string | undefined,
    metadata,
  };
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client with user auth for RLS-protected queries
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    // Service client for explicit authorization check
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate payload
    const rawPayload = await req.json();
    const payload = validatePayload(rawPayload);
    console.log('Send message request:', { ...payload, text: payload.text ? '[REDACTED]' : undefined });

    const organizationId = payload.organization_id;

    // EXPLICIT AUTHORIZATION CHECK: Verify user belongs to the organization
    const { data: membership, error: membershipError } = await supabaseService
      .from('organization_members')
      .select('id, role, active')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('active', true)
      .maybeSingle();

    if (membershipError) {
      console.error('Error checking organization membership:', membershipError);
      return new Response(
        JSON.stringify({ error: 'Error verifying permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!membership) {
      console.warn(`User ${user.id} attempted to send message to organization ${organizationId} without membership`);
      return new Response(
        JSON.stringify({ error: 'You are not a member of this organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has appropriate role to send messages
    const allowedRoles = ['admin', 'gerente', 'recepcao', 'comercial'];
    if (!allowedRoles.includes(membership.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to send messages' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get integration settings filtered by organization
    const { data: integrationSettings, error: integrationError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'whatsapp_evolution')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .maybeSingle();

    if (integrationError) {
      console.error('Error fetching integration settings:', integrationError);
      return new Response(
        JSON.stringify({ error: 'Error fetching integration settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integrationSettings) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp integration not configured for this organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evolutionInstance = integrationSettings.settings?.evolution_instance;
    const evolutionBaseUrl = integrationSettings.settings?.evolution_base_url;
    const evolutionApiKey = integrationSettings.settings?.evolution_api_key;

    if (!evolutionBaseUrl || !evolutionApiKey || !evolutionInstance) {
      return new Response(
        JSON.stringify({ error: 'Evolution API not configured properly' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone
    const phoneWithCountry = payload.phone.startsWith('55') ? payload.phone : `55${payload.phone}`;

    let conversationId = payload.conversation_id;

    // Find or create conversation
    if (!conversationId) {
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('phone', phoneWithCountry)
        .eq('channel', 'whatsapp')
        .eq('organization_id', organizationId)
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
            evolution_instance: evolutionInstance,
            phone: phoneWithCountry,
            status: 'open',
            assigned_user_id: user.id,
            last_message_at: new Date().toISOString(),
            organization_id: organizationId,
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
        organization_id: organizationId,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      throw messageError;
    }

    // Send directly to Evolution API
    console.log('Sending message to Evolution API');
    let providerMessageId: string | null = null;
    
    const evolutionPayload = {
      number: phoneWithCountry,
      text: payload.text,
      ...(payload.media && { 
        mediaMessage: {
          mediatype: payload.type === 'image' ? 'image' : 'document',
          media: payload.media,
        }
      }),
    };

    const evolutionUrl = `${evolutionBaseUrl}/message/sendText/${evolutionInstance}`;
    
    const evolutionResponse = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify(evolutionPayload),
    });

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text();
      console.error('Evolution API failed:', errorText);
      
      await supabase
        .from('messages')
        .update({ status: 'failed' })
        .eq('id', newMessage.id);

      throw new Error('Failed to send message via Evolution API');
    }

    const evolutionResult = await evolutionResponse.json();
    console.log('Evolution response received');
    providerMessageId = evolutionResult.key?.id || evolutionResult.message?.key?.id;

    // Update message with provider ID and status
    const { data: updatedMessage } = await supabase
      .from('messages')
      .update({
        provider_message_id: providerMessageId,
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

    // Update lead substatus if sending to a hot lead
    if (payload.lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('temperature')
        .eq('id', payload.lead_id)
        .maybeSingle();

      if (lead?.temperature === 'quente') {
        await supabase
          .from('leads')
          .update({ 
            hot_substatus: 'aguardando_resposta',
            last_interaction_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', payload.lead_id);
        console.log('Updated lead substatus to aguardando_resposta');
      }
    }

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