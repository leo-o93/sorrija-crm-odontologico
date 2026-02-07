import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransitionRule {
  id: string;
  organization_id: string;
  name: string;
  priority: number;
  active: boolean;
  trigger_event: 'inactivity_timer' | 'substatus_timeout' | 'no_response';
  from_temperature: string | null;
  from_substatus: string | null;
  timer_minutes: number;
  action_set_temperature: string | null;
  action_clear_substatus: boolean;
  action_set_substatus: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    return new Response(
      JSON.stringify({ success: false, error: 'Missing configuration' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting auto lead transitions with dynamic rules...');

    // Get all active transition rules grouped by organization
    const { data: rules, error: rulesError } = await supabase
      .from('temperature_transition_rules')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: true });

    if (rulesError) {
      console.error('Error fetching transition rules:', rulesError);
      // Return 200 with error info instead of 500 to prevent cron failures
      return new Response(
        JSON.stringify({ success: false, error: rulesError.message, transitions: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!rules || rules.length === 0) {
      console.log('No active transition rules found');
      return new Response(
        JSON.stringify({ success: true, message: 'No active rules to process', transitions: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group rules by organization
    const rulesByOrg: Record<string, TransitionRule[]> = {};
    for (const rule of rules as TransitionRule[]) {
      if (!rulesByOrg[rule.organization_id]) {
        rulesByOrg[rule.organization_id] = [];
      }
      rulesByOrg[rule.organization_id].push(rule);
    }

    let totalTransitions = 0;
    let totalSubstatusCleared = 0;
    const errors: string[] = [];

    // Process each organization
    for (const [organizationId, orgRules] of Object.entries(rulesByOrg)) {
      console.log(`Processing org ${organizationId} with ${orgRules.length} rules...`);

      for (const rule of orgRules) {
        try {
          console.log(`  Processing rule: ${rule.name} (${rule.trigger_event})`);

          const threshold = new Date();
          threshold.setMinutes(threshold.getMinutes() - rule.timer_minutes);

          // Build query based on conditions
          let query = supabase
            .from('leads')
            .select('id, name, last_interaction_at, created_at')
            .eq('organization_id', organizationId);

          // Apply temperature filter if specified
          if (rule.from_temperature) {
            query = query.eq('temperature', rule.from_temperature);
          }

          // Apply substatus filter if specified
          if (rule.from_substatus) {
            query = query.eq('hot_substatus', rule.from_substatus);
          } else if (rule.trigger_event === 'inactivity_timer' && rule.from_temperature === 'quente') {
            // For hot leads inactivity, exclude those waiting for response (separate rule)
            query = query.neq('hot_substatus', 'aguardando_resposta');
          }

          // Apply time filter based on trigger event
          if (rule.trigger_event === 'inactivity_timer' || rule.trigger_event === 'substatus_timeout') {
            query = query.or(`last_interaction_at.lt.${threshold.toISOString()},last_interaction_at.is.null`);
          } else if (rule.trigger_event === 'no_response') {
            query = query.lt('last_interaction_at', threshold.toISOString());
          }

          const { data: matchingLeads, error: leadsError } = await query;

          if (leadsError) {
            console.error(`    Error fetching leads for rule ${rule.name}:`, leadsError);
            errors.push(`Rule ${rule.name}: ${leadsError.message}`);
            continue;
          }

          // Filter leads based on creation date if no interaction
          const leadsToProcess = (matchingLeads || []).filter(lead => {
            const checkDate = lead.last_interaction_at || lead.created_at;
            return new Date(checkDate) < threshold;
          });

          if (leadsToProcess.length === 0) {
            console.log(`    No leads match rule conditions`);
            continue;
          }

          console.log(`    Found ${leadsToProcess.length} leads matching rule`);

          // Build update object based on actions
          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };

          if (rule.action_set_temperature) {
            updateData.temperature = rule.action_set_temperature;
          }

          if (rule.action_clear_substatus) {
            updateData.hot_substatus = null;
            totalSubstatusCleared += leadsToProcess.length;
          } else if (rule.action_set_substatus) {
            updateData.hot_substatus = rule.action_set_substatus;
          }

          // If changing to frio, always clear substatus
          if (rule.action_set_temperature === 'frio') {
            updateData.hot_substatus = null;
          }

          const { error: updateError } = await supabase
            .from('leads')
            .update(updateData)
            .in('id', leadsToProcess.map(l => l.id));

          if (updateError) {
            console.error(`    Error updating leads for rule ${rule.name}:`, updateError);
            errors.push(`Rule ${rule.name} update: ${updateError.message}`);
          } else {
            if (rule.action_set_temperature) {
              totalTransitions += leadsToProcess.length;
            }
            console.log(`    Applied rule to ${leadsToProcess.length} leads`);
          }
        } catch (ruleError) {
          const errorMsg = ruleError instanceof Error ? ruleError.message : 'Unknown error';
          console.error(`    Error processing rule ${rule.name}:`, errorMsg);
          errors.push(`Rule ${rule.name}: ${errorMsg}`);
        }
      }
    }

    console.log(`Auto transitions complete. Total transitions: ${totalTransitions}, substatus cleared: ${totalSubstatusCleared}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${Object.keys(rulesByOrg).length} organizations with ${rules.length} rules`,
        transitions_made: totalTransitions,
        substatuses_cleared: totalSubstatusCleared,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto lead transitions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Return 200 with error info to prevent cron job failures
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, transitions: 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
