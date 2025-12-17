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

    // Validate organization_id
    if (!payload.organization_id) {
      return new Response(
        JSON.stringify({ error: 'organization_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const organizationId = payload.organization_id;

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
            evolution_instance: integrationSettings.settings?.evolution_instance,
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

    // Choose between n8n webhook or direct Evolution API call
    const n8nWebhookUrl = integrationSettings.settings?.n8n_outgoing_url;
    let providerMessageId: string | null = null;
    
    if (n8nWebhookUrl) {
      // Send via n8n webhook
      console.log('Sending via n8n webhook:', n8nWebhookUrl);
      
      const n8nPayload = {
        conversation_id: conversationId,
        local_message_id: newMessage.id,
        phone: phoneWithCountry,
        type: payload.type,
        text: payload.text,
        media: payload.media,
        instance: evolutionInstance,
        metadata: payload.metadata,
      };

      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload),
      });

      if (!n8nResponse.ok) {
        console.error('n8n webhook failed:', await n8nResponse.text());
        
        await supabase
          .from('messages')
          .update({ status: 'failed' })
          .eq('id', newMessage.id);

        throw new Error('Failed to send message via n8n');
      }

      const n8nResult = await n8nResponse.json();
      console.log('n8n response:', n8nResult);
      providerMessageId = n8nResult.message_id || n8nResult.id;
      
    } else {
      // Send directly to Evolution API
      console.log('Sending directly to Evolution API');
      
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
      console.log('Evolution URL:', evolutionUrl);
      
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

        throw new Error(`Failed to send message via Evolution API: ${errorText}`);
      }

      const evolutionResult = await evolutionResponse.json();
      console.log('Evolution response:', evolutionResult);
      providerMessageId = evolutionResult.key?.id || evolutionResult.message?.key?.id;
    }

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
