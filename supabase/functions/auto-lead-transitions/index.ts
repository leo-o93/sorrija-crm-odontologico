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

    // Get all organizations with their CRM settings
    const { data: crmSettings, error: settingsError } = await supabase
      .from('crm_settings')
      .select('organization_id, hot_to_cold_days, hot_to_cold_hours, enable_auto_temperature')
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

    for (const settings of crmSettings) {
      const { organization_id, hot_to_cold_days, hot_to_cold_hours } = settings;
      
      // Calculate threshold in hours
      const thresholdHours = (hot_to_cold_days || 3) * 24 + (hot_to_cold_hours || 0);
      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - thresholdHours);

      console.log(`Processing org ${organization_id}: threshold ${thresholdHours} hours (since ${thresholdDate.toISOString()})`);

      // Find hot leads that haven't had interaction since threshold
      const { data: staleHotLeads, error: hotLeadsError } = await supabase
        .from('leads')
        .select('id, name, last_interaction_at')
        .eq('organization_id', organization_id)
        .eq('temperature', 'quente')
        .lt('last_interaction_at', thresholdDate.toISOString());

      if (hotLeadsError) {
        console.error(`Error fetching hot leads for org ${organization_id}:`, hotLeadsError);
        continue;
      }

      // Also find new leads that haven't had any interaction within threshold
      const { data: staleNewLeads, error: newLeadsError } = await supabase
        .from('leads')
        .select('id, name, last_interaction_at, created_at')
        .eq('organization_id', organization_id)
        .eq('temperature', 'novo')
        .or(`last_interaction_at.lt.${thresholdDate.toISOString()},last_interaction_at.is.null`);

      if (newLeadsError) {
        console.error(`Error fetching new leads for org ${organization_id}:`, newLeadsError);
      }

      // Filter new leads: only transition if created_at is also older than threshold
      const filteredNewLeads = (staleNewLeads || []).filter(lead => {
        const checkDate = lead.last_interaction_at || lead.created_at;
        return new Date(checkDate) < thresholdDate;
      });

      const allStaleLeads = [...(staleHotLeads || []), ...filteredNewLeads];

      if (allStaleLeads.length > 0) {
        console.log(`Found ${staleHotLeads?.length || 0} stale hot leads and ${filteredNewLeads.length} stale new leads to transition to cold`);

        // Update leads to cold
        const { error: updateError } = await supabase
          .from('leads')
          .update({ 
            temperature: 'frio',
            hot_substatus: null,
            updated_at: new Date().toISOString()
          })
          .in('id', allStaleLeads.map(l => l.id));

        if (updateError) {
          console.error('Error updating leads:', updateError);
        } else {
          totalTransitions += allStaleLeads.length;
          console.log(`Transitioned ${allStaleLeads.length} leads to cold`);
        }
      }
    }

    console.log(`Auto transitions complete. Total: ${totalTransitions}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${crmSettings.length} organizations`,
        transitions: totalTransitions 
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
