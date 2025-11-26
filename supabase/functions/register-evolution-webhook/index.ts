import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the latest active WhatsApp Evolution integration
    const { data: settings, error: settingsError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'whatsapp_evolution')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (settingsError || !settings) {
      console.error('Settings not found:', settingsError);
      return new Response(
        JSON.stringify({ error: 'WhatsApp Evolution integration not configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evolutionBaseUrl = settings.settings.evolution_base_url;
    const evolutionApiKey = settings.settings.evolution_api_key;
    const evolutionInstance = settings.settings.evolution_instance;
    const webhookSecret = settings.settings.webhook_secret;

    if (!evolutionBaseUrl || !evolutionApiKey || !evolutionInstance || !webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Missing required configuration fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Webhook URL for incoming messages
    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-incoming`;

    console.log('Registering webhook with Evolution API:', {
      instance: evolutionInstance,
      webhookUrl,
    });

    // Register webhook with Evolution API
    const response = await fetch(
      `${evolutionBaseUrl}/webhook/set/${evolutionInstance}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          enabled: true,
          url: webhookUrl,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CONNECTION_UPDATE',
          ],
          webhook_by_events: false,
          webhook_base64: false,
          headers: {
            'x-webhook-token': webhookSecret,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API error:', errorText);
      throw new Error(`Failed to register webhook: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Webhook registered successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook registrado com sucesso na Evolution API',
        data: result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error registering webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});