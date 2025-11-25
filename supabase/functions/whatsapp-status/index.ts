import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

interface StatusWebhookPayload {
  provider: string;
  instance: string;
  message_id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookToken = req.headers.get('x-webhook-token');
    
    if (!webhookToken) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: StatusWebhookPayload = await req.json();
    console.log('Received status update:', payload);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find message by provider_message_id
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*, conversations!inner(*, integration_settings:organizations!inner(integration_settings!inner(*)))')
      .eq('provider_message_id', payload.message_id)
      .maybeSingle();

    if (messageError || !message) {
      console.error('Message not found:', messageError);
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate webhook token
    const conversation = message.conversations as any;
    const integrationSettings = await supabase
      .from('integration_settings')
      .select('settings')
      .eq('organization_id', conversation.organization_id)
      .eq('integration_type', 'whatsapp_evolution')
      .single();

    const storedToken = integrationSettings.data?.settings?.webhook_secret;
    if (storedToken !== webhookToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update message status
    const updateData: any = {
      status: payload.status,
    };

    if (payload.sent_at) updateData.sent_at = payload.sent_at;
    if (payload.delivered_at) updateData.delivered_at = payload.delivered_at;
    if (payload.read_at) updateData.read_at = payload.read_at;

    const { error: updateError } = await supabase
      .from('messages')
      .update(updateData)
      .eq('id', message.id);

    if (updateError) {
      console.error('Error updating message:', updateError);
      throw updateError;
    }

    console.log('Message status updated successfully:', message.id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing status update:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
