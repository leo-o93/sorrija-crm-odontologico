import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CampaignPayload {
  organization_id: string;
  lead_ids: string[];
  template_id: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

// Helper to get random delay between min and max milliseconds
function getRandomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Replace template variables with lead data
function personalizeMessage(template: string, lead: Lead): string {
  return template
    .replace(/\{nome\}/gi, lead.name || 'Cliente')
    .replace(/\{primeiro_nome\}/gi, (lead.name || 'Cliente').split(' ')[0])
    .replace(/\{telefone\}/gi, lead.phone)
    .replace(/\{email\}/gi, lead.email || '');
}

// Sleep function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse payload
    const payload: CampaignPayload = await req.json();
    const { organization_id, lead_ids, template_id } = payload;

    if (!organization_id || !lead_ids || !template_id || lead_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'organization_id, lead_ids, and template_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Campaign send request: ${lead_ids.length} leads, template: ${template_id}`);

    // Verify user is member of organization
    const { data: membership, error: membershipError } = await supabaseService
      .from('organization_members')
      .select('id, role, active')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .eq('active', true)
      .maybeSingle();

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'You are not a member of this organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has permission to send messages
    const allowedRoles = ['admin', 'usuario'];
    if (!allowedRoles.includes(membership.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to send campaigns' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', template_id)
      .eq('organization_id', organization_id)
      .maybeSingle();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get integration settings
    const { data: integrationSettings, error: integrationError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'whatsapp_evolution')
      .eq('organization_id', organization_id)
      .eq('active', true)
      .maybeSingle();

    if (integrationError || !integrationSettings) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp integration not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evolutionInstance = integrationSettings.settings?.evolution_instance;
    const evolutionBaseUrl = integrationSettings.settings?.evolution_base_url;
    const evolutionApiKey = integrationSettings.settings?.evolution_api_key;

    if (!evolutionBaseUrl || !evolutionApiKey || !evolutionInstance) {
      return new Response(
        JSON.stringify({ error: 'Evolution API not configured properly' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get leads data
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, phone, email')
      .in('id', lead_ids)
      .eq('organization_id', organization_id);

    if (leadsError || !leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No leads found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${leads.length} leads to process`);

    // Results tracking
    const results: { success: string[]; failed: string[]; errors: Record<string, string> } = {
      success: [],
      failed: [],
      errors: {},
    };

    // Shuffle leads for randomization (anti-detection)
    const shuffledLeads = shuffleArray(leads);

    // Process leads sequentially with delays
    for (let i = 0; i < shuffledLeads.length; i++) {
      const lead = shuffledLeads[i];
      
      try {
        // Personalize message
        const personalizedText = personalizeMessage(template.content, lead);

        // Normalize phone
        const phone = lead.phone.replace(/\D/g, '');
        const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`;

        // Find or create conversation
        let conversationId: string;
        
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('phone', phoneWithCountry)
          .eq('channel', 'whatsapp')
          .eq('organization_id', organization_id)
          .maybeSingle();

        if (existingConversation) {
          conversationId = existingConversation.id;
        } else {
          const { data: newConversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              contact_type: 'lead',
              lead_id: lead.id,
              channel: 'whatsapp',
              evolution_instance: evolutionInstance,
              phone: phoneWithCountry,
              status: 'open',
              assigned_user_id: user.id,
              last_message_at: new Date().toISOString(),
              organization_id: organization_id,
            })
            .select()
            .single();

          if (convError) throw convError;
          conversationId = newConversation.id;
        }

        // Create message in database
        const { data: newMessage, error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            direction: 'out',
            type: 'text',
            content_text: personalizedText,
            status: 'queued',
            created_by_user_id: user.id,
            organization_id: organization_id,
          })
          .select()
          .single();

        if (messageError) throw messageError;

        // Send to Evolution API
        const evolutionPayload = {
          number: phoneWithCountry,
          text: personalizedText,
        };

        const evolutionUrl = `${evolutionBaseUrl}/message/sendText/${evolutionInstance}`;
        
        const evolutionResponse = await fetch(evolutionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify(evolutionPayload),
        });

        if (!evolutionResponse.ok) {
          const errorText = await evolutionResponse.text();
          console.error(`Evolution API failed for lead ${lead.id}:`, errorText);
          
          await supabase
            .from('messages')
            .update({ status: 'failed' })
            .eq('id', newMessage.id);

          results.failed.push(lead.id);
          results.errors[lead.id] = `Evolution API error: ${errorText.substring(0, 100)}`;
          continue;
        }

        const evolutionResult = await evolutionResponse.json();
        const providerMessageId = evolutionResult.key?.id || evolutionResult.message?.key?.id;

        // Update message with provider ID and status
        await supabase
          .from('messages')
          .update({
            provider_message_id: providerMessageId,
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', newMessage.id);

        // Update conversation last_message_at
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);

        // Update lead last_interaction_at
        await supabase
          .from('leads')
          .update({ 
            last_interaction_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

        results.success.push(lead.id);
        console.log(`Message sent successfully to lead ${lead.id} (${i + 1}/${shuffledLeads.length})`);

        // Apply delay before next message (anti-detection techniques)
        if (i < shuffledLeads.length - 1) {
          // Base delay: 6-13 seconds
          let delayMs = getRandomDelay(6000, 13000);
          
          // Add jitter: +/- 0-2 seconds
          delayMs += getRandomDelay(-2000, 2000);
          
          // Every 10-15 messages, add extra pause (30-60 seconds)
          const batchSize = getRandomDelay(10, 15);
          if ((i + 1) % batchSize === 0) {
            const extraPause = getRandomDelay(30000, 60000);
            delayMs += extraPause;
            console.log(`Extra pause after ${i + 1} messages: ${extraPause / 1000}s`);
          }
          
          // Ensure minimum delay of 5 seconds
          delayMs = Math.max(delayMs, 5000);
          
          console.log(`Waiting ${(delayMs / 1000).toFixed(1)}s before next message...`);
          await sleep(delayMs);
        }

      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error);
        results.failed.push(lead.id);
        results.errors[lead.id] = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    console.log(`Campaign completed: ${results.success.length} success, ${results.failed.length} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total: shuffledLeads.length,
        sent: results.success.length,
        failed: results.failed.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in campaign-send:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
