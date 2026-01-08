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

    console.log('Starting auto lead transitions...');

    // Get all organizations with their CRM settings (including new fields)
    const { data: crmSettings, error: settingsError } = await supabase
      .from('crm_settings')
      .select(`
        organization_id, 
        hot_to_cold_days, 
        hot_to_cold_hours, 
        enable_auto_temperature,
        new_to_cold_minutes,
        em_conversa_timeout_minutes,
        enable_substatus_timeout,
        aguardando_to_cold_hours
      `)
      .eq('enable_auto_temperature', true);

    if (settingsError) {
      console.error('Error fetching CRM settings:', settingsError);
      throw settingsError;
    }

    if (!crmSettings || crmSettings.length === 0) {
      console.log('No organizations with auto temperature enabled');
      return new Response(
        JSON.stringify({ success: true, message: 'No organizations to process', transitions: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalTransitions = 0;
    let totalSubstatusCleared = 0;

    for (const settings of crmSettings) {
      const { 
        organization_id, 
        hot_to_cold_days, 
        hot_to_cold_hours,
        new_to_cold_minutes,
        em_conversa_timeout_minutes,
        enable_substatus_timeout,
        aguardando_to_cold_hours
      } = settings;

      console.log(`Processing org ${organization_id}...`);

      // ============================================
      // 1. NOVO → FRIO (timer em minutos)
      // ============================================
      const newToColdMins = new_to_cold_minutes || 1440; // default 24h em minutos
      const newToColdThreshold = new Date();
      newToColdThreshold.setMinutes(newToColdThreshold.getMinutes() - newToColdMins);

      console.log(`  NOVO→FRIO: threshold ${newToColdMins}min (since ${newToColdThreshold.toISOString()})`);

      // Find new leads without interaction since threshold
      const { data: staleNewLeads, error: newLeadsError } = await supabase
        .from('leads')
        .select('id, name, last_interaction_at, created_at')
        .eq('organization_id', organization_id)
        .eq('temperature', 'novo')
        .or(`last_interaction_at.lt.${newToColdThreshold.toISOString()},last_interaction_at.is.null`);

      if (newLeadsError) {
        console.error(`  Error fetching new leads:`, newLeadsError);
      } else {
        // Filter: only transition if created_at is also older than threshold
        const filteredNewLeads = (staleNewLeads || []).filter(lead => {
          const checkDate = lead.last_interaction_at || lead.created_at;
          return new Date(checkDate) < newToColdThreshold;
        });

        if (filteredNewLeads.length > 0) {
          console.log(`  Found ${filteredNewLeads.length} stale NOVO leads to transition to FRIO`);

          const { error: updateNewError } = await supabase
            .from('leads')
            .update({ 
              temperature: 'frio',
              hot_substatus: null,
              updated_at: new Date().toISOString()
            })
            .in('id', filteredNewLeads.map(l => l.id));

          if (updateNewError) {
            console.error('  Error updating NOVO leads:', updateNewError);
          } else {
            totalTransitions += filteredNewLeads.length;
            console.log(`  Transitioned ${filteredNewLeads.length} NOVO leads to FRIO`);
          }
        }
      }

      // ============================================
      // 2. QUENTE → FRIO (timer existente)
      // ============================================
      const hotToColdHours = (hot_to_cold_days || 3) * 24 + (hot_to_cold_hours || 0);
      const hotToColdThreshold = new Date();
      hotToColdThreshold.setHours(hotToColdThreshold.getHours() - hotToColdHours);

      console.log(`  QUENTE→FRIO: threshold ${hotToColdHours}h (since ${hotToColdThreshold.toISOString()})`);

      // Find hot leads without interaction (excluding those with aguardando_resposta - handled separately)
      const { data: staleHotLeads, error: hotLeadsError } = await supabase
        .from('leads')
        .select('id, name, last_interaction_at')
        .eq('organization_id', organization_id)
        .eq('temperature', 'quente')
        .neq('hot_substatus', 'aguardando_resposta')
        .lt('last_interaction_at', hotToColdThreshold.toISOString());

      if (hotLeadsError) {
        console.error(`  Error fetching hot leads:`, hotLeadsError);
      } else if (staleHotLeads && staleHotLeads.length > 0) {
        console.log(`  Found ${staleHotLeads.length} stale QUENTE leads to transition to FRIO`);

        const { error: updateHotError } = await supabase
          .from('leads')
          .update({ 
            temperature: 'frio',
            hot_substatus: null,
            updated_at: new Date().toISOString()
          })
          .in('id', staleHotLeads.map(l => l.id));

        if (updateHotError) {
          console.error('  Error updating QUENTE leads:', updateHotError);
        } else {
          totalTransitions += staleHotLeads.length;
          console.log(`  Transitioned ${staleHotLeads.length} QUENTE leads to FRIO`);
        }
      }

      // ============================================
      // 3. Limpar substatus "em_conversa" após timeout
      // ============================================
      if (enable_substatus_timeout) {
        const emConversaMinutes = em_conversa_timeout_minutes || 60;
        const emConversaThreshold = new Date();
        emConversaThreshold.setMinutes(emConversaThreshold.getMinutes() - emConversaMinutes);

        console.log(`  em_conversa timeout: ${emConversaMinutes}min (since ${emConversaThreshold.toISOString()})`);

        const { data: staleEmConversa, error: emConversaError } = await supabase
          .from('leads')
          .select('id, name')
          .eq('organization_id', organization_id)
          .eq('temperature', 'quente')
          .eq('hot_substatus', 'em_conversa')
          .lt('last_interaction_at', emConversaThreshold.toISOString());

        if (emConversaError) {
          console.error('  Error fetching em_conversa leads:', emConversaError);
        } else if (staleEmConversa && staleEmConversa.length > 0) {
          console.log(`  Found ${staleEmConversa.length} leads with stale "em_conversa" substatus`);

          const { error: updateSubstatusError } = await supabase
            .from('leads')
            .update({ 
              hot_substatus: null,
              updated_at: new Date().toISOString()
            })
            .in('id', staleEmConversa.map(l => l.id));

          if (updateSubstatusError) {
            console.error('  Error clearing em_conversa substatus:', updateSubstatusError);
          } else {
            totalSubstatusCleared += staleEmConversa.length;
            console.log(`  Cleared "em_conversa" substatus for ${staleEmConversa.length} leads`);
          }
        }
      }

      // ============================================
      // 4. "Aguardando resposta" → FRIO após timeout
      // ============================================
      const aguardandoHours = aguardando_to_cold_hours || 48;
      const aguardandoThreshold = new Date();
      aguardandoThreshold.setHours(aguardandoThreshold.getHours() - aguardandoHours);

      console.log(`  aguardando_resposta→FRIO: ${aguardandoHours}h (since ${aguardandoThreshold.toISOString()})`);

      const { data: staleAguardando, error: aguardandoError } = await supabase
        .from('leads')
        .select('id, name')
        .eq('organization_id', organization_id)
        .eq('temperature', 'quente')
        .eq('hot_substatus', 'aguardando_resposta')
        .lt('last_interaction_at', aguardandoThreshold.toISOString());

      if (aguardandoError) {
        console.error('  Error fetching aguardando_resposta leads:', aguardandoError);
      } else if (staleAguardando && staleAguardando.length > 0) {
        console.log(`  Found ${staleAguardando.length} "aguardando_resposta" leads to transition to FRIO`);

        const { error: updateAguardandoError } = await supabase
          .from('leads')
          .update({ 
            temperature: 'frio',
            hot_substatus: null,
            updated_at: new Date().toISOString()
          })
          .in('id', staleAguardando.map(l => l.id));

        if (updateAguardandoError) {
          console.error('  Error updating aguardando_resposta leads:', updateAguardandoError);
        } else {
          totalTransitions += staleAguardando.length;
          console.log(`  Transitioned ${staleAguardando.length} "aguardando_resposta" leads to FRIO`);
        }
      }
    }

    console.log(`Auto transitions complete. Total transitions: ${totalTransitions}, substatus cleared: ${totalSubstatusCleared}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${crmSettings.length} organizations`,
        transitions: totalTransitions,
        substatus_cleared: totalSubstatusCleared
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto lead transitions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
