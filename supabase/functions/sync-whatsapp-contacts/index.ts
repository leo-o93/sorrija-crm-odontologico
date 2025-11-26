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

    // Buscar configuração da Evolution API
    const { data: config, error: configError } = await supabase
      .from('evolution_config')
      .select('*')
      .single();

    if (configError || !config) {
      throw new Error('Evolution API não configurada');
    }

    console.log('Fetching contacts from Evolution API...');

    // Buscar contatos da Evolution API
    const response = await fetch(
      `${config.evolution_base_url}/chat/findContacts/${config.evolution_instance}`,
      {
        headers: {
          'apikey': config.evolution_api_key,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`);
    }

    const contacts = await response.json();
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

    // Atualizar última sincronização
    await supabase
      .from('evolution_config')
      .update({ last_sync_at: new Date().toISOString() })
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
