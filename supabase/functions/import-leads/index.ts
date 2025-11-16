import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Lead {
  name: string;
  phone: string;
  registration_date: string;
  source_id?: string | null;
  interest_id?: string | null;
  status: string;
  first_contact_channel?: string | null;
  second_contact_channel?: string | null;
  third_contact_channel?: string | null;
  scheduled: boolean;
  scheduled_on_attempt?: string | null;
  appointment_date?: string | null;
  evaluation_result?: string | null;
  budget_total?: number | null;
  budget_paid?: number | null;
  notes?: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Iniciando importação de leads...");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { leads } = await req.json();

    if (!leads || !Array.isArray(leads)) {
      throw new Error("Dados inválidos: esperado array de leads");
    }

    console.log(`Recebidos ${leads.length} leads para importar`);

    // 1. Criar novas fontes necessárias
    console.log("Criando novas fontes...");
    const newSources = [
      { name: "Facebook - Anúncios", channel: "online" },
      { name: "Instagram - Anúncios", channel: "online" },
      { name: "Retroativo", channel: "outros" }
    ];

    for (const source of newSources) {
      const { error } = await supabase
        .from('sources')
        .upsert({ name: source.name, channel: source.channel }, { onConflict: 'name' });
      if (error) console.error(`Erro ao criar fonte ${source.name}:`, error);
    }

    // 2. Inserir leads em lotes
    const BATCH_SIZE = 100;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      console.log(`Inserindo lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(leads.length / BATCH_SIZE)}...`);
      
      const { error } = await supabase.from('leads').insert(batch);
      
      if (error) {
        console.error(`Erro ao inserir lote:`, error);
        errors += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    console.log(`Importação concluída! Inseridos: ${inserted}, Erros: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        errors,
        message: `Importação concluída com sucesso! ${inserted} leads inseridos.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na importação:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
