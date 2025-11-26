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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Buscar configuração da Evolution API
    const { data: config, error: configError } = await supabase
      .from('evolution_config')
      .select('*')
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ 
          status: 'not_configured',
          message: 'Evolution API não configurada' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Checking WhatsApp connection status...');

    // Verificar status da instância
    const response = await fetch(
      `${config.evolution_base_url}/instance/connectionState/${config.evolution_instance}`,
      {
        headers: {
          'apikey': config.evolution_api_key,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`);
    }

    const connectionState = await response.json();
    console.log('Connection state:', connectionState);

    return new Response(
      JSON.stringify({
        status: connectionState.state || 'unknown',
        instance: config.evolution_instance,
        last_sync: config.last_sync_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error checking status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
