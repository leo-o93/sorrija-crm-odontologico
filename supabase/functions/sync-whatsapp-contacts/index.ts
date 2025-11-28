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

    // Buscar configuração da Evolution API (mais recente)
    const { data: config, error: configError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'whatsapp_evolution')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching config:', configError);
      throw new Error(`Erro ao buscar configuração: ${configError.message}`);
    }

    if (!config) {
      throw new Error('Evolution API não configurada');
    }

    const settings = config.settings as any;
    const cleanUrl = settings.evolution_base_url.replace(/\/manager\/?$/, '');

    console.log('Fetching contacts from Evolution API...');

    // Buscar contatos/conversas da Evolution API
    const response = await fetch(
      `${cleanUrl}/chat/findChats/${settings.evolution_instance}`,
      {
        headers: {
          'apikey': settings.evolution_api_key,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API error:', errorText);
      throw new Error(`Evolution API error: ${response.status} ${response.statusText}`);
    }

    const chatsData = await response.json();
    const contacts = Array.isArray(chatsData) ? chatsData : [];
    console.log(`Found ${contacts.length} contacts`);

    // Sincronizar contatos com a tabela de leads
    const leadsToUpsert = contacts
      .filter((contact: any) => contact.id && contact.id.includes('@')) // Apenas contatos válidos
      .map((contact: any) => ({
        phone: contact.id.replace('@s.whatsapp.net', ''),
        name: contact.pushName || contact.name || contact.id.split('@')[0],
        status: 'novo_lead',
        first_contact_channel: 'whatsapp',
        first_contact_date: new Date().toISOString(),
      }));

    if (leadsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('leads')
        .upsert(leadsToUpsert, {
          onConflict: 'phone',
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error('Error upserting leads:', upsertError);
        throw upsertError;
      }
    }

    // Atualizar última sincronização (opcional, pode remover se não precisar)
    await supabase
      .from('integration_settings')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', config.id);

    console.log(`Successfully synced ${leadsToUpsert.length} contacts`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: leadsToUpsert.length,
        total: contacts.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error syncing contacts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
