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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get organizationId from request body
    const { organizationId } = await req.json();

    if (!organizationId) {
      return new Response(
        JSON.stringify({ 
          status: 'error',
          message: 'organizationId is required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se é Super Admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Se não for super admin, verificar membership
    if (!superAdmin) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('id, role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('active', true)
        .maybeSingle();

      if (!membership) {
        return new Response(
          JSON.stringify({ error: 'Access denied: not a member of this organization' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar configuração da Evolution API para a organização
    const { data: config, error: configError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'whatsapp_evolution')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching config:', configError);
      return new Response(
        JSON.stringify({ 
          status: 'error',
          message: `Erro ao buscar configuração: ${configError.message}` 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!config) {
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

    const settings = config.settings as any;
    const cleanUrl = settings.evolution_base_url.replace(/\/manager\/?$/, '');

    console.log('Checking WhatsApp connection status...');

    // Verificar status da instância
    const response = await fetch(
      `${cleanUrl}/instance/connectionState/${settings.evolution_instance}`,
      {
        headers: {
          'apikey': settings.evolution_api_key,
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
        status: connectionState.instance?.state || 'unknown',
        instance: settings.evolution_instance,
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
