import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  sender?: string; // Campo que contém o telefone real do contato (ex: 553183932843@s.whatsapp.net)
  data: {
    key?: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
      senderPn?: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        url: string;
        caption?: string;
      };
      videoMessage?: {
        url: string;
        caption?: string;
      };
      audioMessage?: {
        url: string;
      };
      documentMessage?: {
        url: string;
        fileName?: string;
      };
    };
    messageType?: string;
    messageTimestamp?: number;
  };
}

interface InterestTrigger {
  id: string;
  name: string;
  condition_field: string;
  condition_operator: string;
  condition_value: string;
  case_sensitive: boolean;
  action_set_interest_id: string | null;
  action_set_source_id: string | null;
  action_set_temperature: string | null;
  action_set_status: string | null;
  priority: number;
}

// Function to evaluate trigger conditions
function evaluateTriggerCondition(
  trigger: InterestTrigger,
  messageText: string
): boolean {
  const value = trigger.condition_value || '';
  const testValue = trigger.case_sensitive ? messageText : messageText.toLowerCase();
  const conditionValue = trigger.case_sensitive ? value : value.toLowerCase();

  switch (trigger.condition_operator) {
    case 'contains':
      return testValue.includes(conditionValue);
    case 'not_contains':
      return !testValue.includes(conditionValue);
    case 'equals':
      return testValue === conditionValue;
    case 'not_equals':
      return testValue !== conditionValue;
    case 'starts_with':
      return testValue.startsWith(conditionValue);
    case 'ends_with':
      return testValue.endsWith(conditionValue);
    case 'regex':
      try {
        const regex = new RegExp(value, trigger.case_sensitive ? '' : 'i');
        return regex.test(messageText);
      } catch {
        return false;
      }
    case 'is_empty':
      return testValue.trim() === '';
    case 'is_not_empty':
      return testValue.trim() !== '';
    default:
      return false;
  }
}

// Interface for transition rules
interface TransitionRule {
  id: string;
  from_temperature: string | null;
  from_substatus: string | null;
  condition_message_direction: string | null;
  action_set_temperature: string | null;
  action_clear_substatus: boolean;
  action_set_substatus: string | null;
  priority: number;
}

// Function to apply message_received transition rules
async function applyMessageReceivedRules(
  supabase: any,
  organizationId: string,
  leadId: string,
  currentTemperature: string,
  currentSubstatus: string | null,
  direction: string
): Promise<void> {
  try {
    // Fetch active message_received rules for this organization
    const { data: rules, error } = await supabase
      .from('temperature_transition_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('trigger_event', 'message_received')
      .eq('active', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching transition rules:', error);
      return;
    }

    if (!rules || rules.length === 0) {
      console.log('No message_received transition rules found');
      return;
    }

    console.log(`Found ${rules.length} message_received rules to evaluate`);

    for (const rule of rules as TransitionRule[]) {
      // Check direction condition
      if (rule.condition_message_direction && rule.condition_message_direction !== direction) {
        console.log(`Rule ${rule.id} skipped: direction mismatch (expected: ${rule.condition_message_direction}, got: ${direction})`);
        continue;
      }

      // Check temperature condition
      if (rule.from_temperature && rule.from_temperature !== currentTemperature) {
        console.log(`Rule ${rule.id} skipped: temperature mismatch (expected: ${rule.from_temperature}, got: ${currentTemperature})`);
        continue;
      }

      // Check substatus condition
      if (rule.from_substatus && rule.from_substatus !== currentSubstatus) {
        console.log(`Rule ${rule.id} skipped: substatus mismatch (expected: ${rule.from_substatus}, got: ${currentSubstatus})`);
        continue;
      }

      // Rule matches! Apply actions
      console.log(`Rule matched: ${rule.id}`);
      
      const updateData: Record<string, any> = {};
      
      if (rule.action_set_temperature) {
        updateData.temperature = rule.action_set_temperature;
      }
      
      if (rule.action_clear_substatus) {
        updateData.hot_substatus = null;
      } else if (rule.action_set_substatus) {
        updateData.hot_substatus = rule.action_set_substatus;
      }

      if (Object.keys(updateData).length > 0) {
        console.log('Applying rule actions:', updateData);
        
        const { error: updateError } = await supabase
          .from('leads')
          .update(updateData)
          .eq('id', leadId);

        if (updateError) {
          console.error('Error applying transition rule:', updateError);
        } else {
          console.log('Successfully applied transition rule');
        }
      }

      // First matching rule wins
      break;
    }
  } catch (err) {
    console.error('Error in applyMessageReceivedRules:', err);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookToken = req.headers.get('x-webhook-token');
    
    if (!webhookToken) {
      console.error('Missing webhook token');
      return new Response(
        JSON.stringify({ error: 'Missing webhook token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: EvolutionWebhookPayload = await req.json();
    console.log('Received Evolution webhook:', JSON.stringify(payload, null, 2));

    // Filtrar apenas eventos de mensagens novas
    const supportedEvents = ['messages.upsert'];
    if (!supportedEvents.includes(payload.event)) {
      console.log(`Ignoring event type: ${payload.event}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Event ${payload.event} ignored - only processing messages.upsert` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar estrutura do payload
    if (!payload.data?.key) {
      console.log('Missing data.key in payload, skipping');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Invalid payload structure - missing data.key' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const instanceName = payload.instance;
    console.log('Looking for integration with instance:', instanceName);

    // Buscar todas as configurações ativas
    const { data: allSettings, error: integrationError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'whatsapp_evolution')
      .eq('active', true);

    if (integrationError || !allSettings || allSettings.length === 0) {
      console.error('No integrations found:', integrationError);
      return new Response(
        JSON.stringify({ error: 'Integration not configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encontrar a configuração específica para esta instância
    const integrationSettings = allSettings.find(
      s => s.settings?.evolution_instance === instanceName
    );

    if (!integrationSettings) {
      console.error('Integration not found for instance:', instanceName);
      console.error('Available instances:', allSettings.map(s => s.settings?.evolution_instance));
      return new Response(
        JSON.stringify({ error: `Integration not configured for instance: ${instanceName}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar o organization_id diretamente da configuração
    const organizationId = integrationSettings.organization_id;
    console.log('Using organization from integration:', organizationId);

    // Validar webhook token
    const storedToken = integrationSettings.settings?.webhook_secret;
    if (storedToken !== webhookToken) {
      console.error('Invalid webhook token for instance:', instanceName);
      console.error('Expected token:', storedToken?.substring(0, 10) + '...');
      console.error('Received token:', webhookToken.substring(0, 10) + '...');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine message direction
    const isFromMe = payload.data.key.fromMe;
    const direction = isFromMe ? 'out' : 'in';
    
    // Detailed logging for debugging message direction
    console.log('📨 Message processing:', {
      direction,
      isFromMe,
      event: payload.event,
      instance: payload.instance,
      remoteJid: payload.data.key.remoteJid,
      messageId: payload.data.key.id
    });
    
    if (isFromMe) {
      console.log('📤 OUTBOUND MESSAGE: Sent from WhatsApp directly (not via CRM)');
    } else {
      console.log('📥 INBOUND MESSAGE: Received from contact');
    }

    // Extract phone number - pode vir em senderPn (número real) ou remoteJid
    const remoteJid = payload.data.key.remoteJid;
    const senderPn = payload.data.key.senderPn;
    let lidId: string | null = null;

    let phoneSource: string | null = null;

    if (isFromMe) {
      // Mensagens enviadas: remoteJid representa o destinatário
      if (remoteJid.includes('@s.whatsapp.net')) {
        phoneSource = remoteJid.replace('@s.whatsapp.net', '');
        console.log('Using remoteJid for outbound phone:', phoneSource);
      } else if (remoteJid.includes('@lid')) {
        console.log('Outbound @lid identifier, trying senderPn/mapping/sender...');
        if (senderPn && senderPn.includes('@s.whatsapp.net')) {
          phoneSource = senderPn.replace('@s.whatsapp.net', '');
          lidId = remoteJid;
          console.log('Using senderPn for outbound @lid:', phoneSource);
        } else {
          // Tentar buscar mapeamento existente
          const { data: lidMapping } = await supabase
            .from('lid_phone_mapping')
            .select('phone')
            .eq('lid_id', remoteJid)
            .eq('organization_id', organizationId)
            .maybeSingle();

          if (lidMapping) {
            phoneSource = lidMapping.phone.replace(/^\+?55/, '');
            console.log('Found outbound lid mapping, phone:', phoneSource);
          } else if (payload.sender && payload.sender.includes('@s.whatsapp.net')) {
            // Fallback: usar campo sender do payload root
            phoneSource = payload.sender.replace('@s.whatsapp.net', '');
            lidId = remoteJid;
            console.log('Using root sender for outbound @lid:', phoneSource);
          }
        }
      } else if (senderPn && senderPn.includes('@s.whatsapp.net')) {
        phoneSource = senderPn.replace('@s.whatsapp.net', '');
        console.log('Using senderPn fallback for outbound phone:', phoneSource);
      }
    } else {
      // Mensagens recebidas: senderPn costuma trazer o número real do contato
      if (senderPn && senderPn.includes('@s.whatsapp.net')) {
        phoneSource = senderPn.replace('@s.whatsapp.net', '');
        console.log('Using senderPn for inbound phone:', phoneSource);
        
        // Se remoteJid é @lid, salvar o mapeamento
        if (remoteJid.includes('@lid')) {
          lidId = remoteJid;
        }
      } else if (remoteJid.includes('@s.whatsapp.net')) {
        phoneSource = remoteJid.replace('@s.whatsapp.net', '');
        console.log('Using remoteJid for inbound phone:', phoneSource);
      } else if (remoteJid.includes('@lid')) {
        console.log('Received @lid identifier, looking for mapping...');
        
        const { data: lidMapping } = await supabase
          .from('lid_phone_mapping')
          .select('phone')
          .eq('lid_id', remoteJid)
          .eq('organization_id', organizationId)
          .maybeSingle();
        
        if (lidMapping) {
          phoneSource = lidMapping.phone.replace(/^\+?55/, '');
          console.log('Found lid mapping, phone:', phoneSource);
        } else {
          console.log('No lid mapping found, cannot extract phone number');
          console.log('remoteJid:', remoteJid);
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Cannot process @lid without mapping - phone number not available' 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        phoneSource = remoteJid.replace(/@.*$/, '');
        console.log('Using fallback for inbound phone:', phoneSource);
      }
    }

    if (!phoneSource) {
      console.log('No phone source resolved, using fallback');
      phoneSource = remoteJid.replace(/@.*$/, '');
    }

    // Validate phoneSource before proceeding
    if (!phoneSource) {
      console.error('Could not extract phone number from message');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Could not extract phone number' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone number
    const normalizedPhone = phoneSource.replace(/\D/g, '');
    const phoneWithCountry = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;
    if (lidId && phoneSource) {
      console.log('Saving lid mapping:', lidId, '->', phoneWithCountry);
      await supabase
        .from('lid_phone_mapping')
        .upsert({
          lid_id: lidId,
          phone: phoneWithCountry,
          organization_id: organizationId,
        }, { onConflict: 'lid_id' });
    }

    // Extract message content
    let messageText = '';
    let mediaUrl = null;
    let messageType = 'text';

    if (payload.data.message?.conversation) {
      messageText = payload.data.message.conversation;
    } else if (payload.data.message?.extendedTextMessage?.text) {
      messageText = payload.data.message.extendedTextMessage.text;
    } else if (payload.data.message?.imageMessage) {
      messageType = 'image';
      mediaUrl = payload.data.message.imageMessage.url;
      messageText = payload.data.message.imageMessage.caption || '';
    } else if (payload.data.message?.videoMessage) {
      messageType = 'video';
      mediaUrl = payload.data.message.videoMessage.url;
      messageText = payload.data.message.videoMessage.caption || '';
    } else if (payload.data.message?.audioMessage) {
      messageType = 'audio';
      mediaUrl = payload.data.message.audioMessage.url;
    } else if (payload.data.message?.documentMessage) {
      messageType = 'document';
      mediaUrl = payload.data.message.documentMessage.url;
      messageText = payload.data.message.documentMessage.fileName || '';
    }

    console.log('Message content:', { messageType, messageText, mediaUrl });

    // Find or create lead/patient using RPC function to prevent race conditions
    let contactId: string | null = null;
    let contactType: 'lead' | 'patient' = 'lead';
    let isNewLead = false;

    // Check if patient exists first
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('phone', phoneWithCountry)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (existingPatient) {
      contactId = existingPatient.id;
      contactType = 'patient';
      console.log('Found existing patient:', contactId);
    } else {
      // Use RPC function to find or create lead atomically (prevents race condition)
      const contactName = isFromMe 
        ? `Contato ${phoneWithCountry.slice(-4)}`
        : (payload.data.pushName || `Contato ${phoneWithCountry.slice(-4)}`);

      // Fetch interest triggers for this organization if incoming message
      let triggerActions: {
        interest_id?: string;
        source_id?: string;
        temperature?: string;
        status?: string;
        triggered_by?: string;
      } = {};

      if (direction === 'in' && messageText) {
        const { data: triggers } = await supabase
          .from('interest_triggers')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('active', true)
          .order('priority', { ascending: true });

        if (triggers && triggers.length > 0) {
          console.log(`Found ${triggers.length} active triggers to evaluate`);
          
          for (const trigger of triggers as InterestTrigger[]) {
            if (evaluateTriggerCondition(trigger, messageText)) {
              console.log(`Trigger matched: ${trigger.name} (${trigger.id})`);
              
              if (trigger.action_set_interest_id) {
                triggerActions.interest_id = trigger.action_set_interest_id;
              }
              if (trigger.action_set_source_id) {
                triggerActions.source_id = trigger.action_set_source_id;
              }
              if (trigger.action_set_temperature) {
                triggerActions.temperature = trigger.action_set_temperature;
              }
              if (trigger.action_set_status) {
                triggerActions.status = trigger.action_set_status;
              }
              triggerActions.triggered_by = trigger.id;
              
              // First matching trigger wins
              break;
            }
          }
        }
      }

      console.log('Calling upsert_lead_by_phone RPC with:', {
        p_phone: phoneWithCountry,
        p_organization_id: organizationId,
        p_name: contactName,
        p_source_id: triggerActions.source_id || null,
        p_interest_id: triggerActions.interest_id || null,
        p_temperature: triggerActions.temperature || 'novo',
        p_status: triggerActions.status || null,
        p_direction: direction
      });

      // Use RPC to atomically find or create lead
      const { data: leadResult, error: rpcError } = await supabase
        .rpc('upsert_lead_by_phone', {
          p_phone: phoneWithCountry,
          p_organization_id: organizationId,
          p_name: contactName,
          p_source_id: triggerActions.source_id || null,
          p_interest_id: triggerActions.interest_id || null,
          p_temperature: triggerActions.temperature || 'novo',
          p_status: triggerActions.status || null,
          p_direction: direction
        });

      if (rpcError) {
        console.error('Error in upsert_lead_by_phone RPC:', rpcError);
        throw rpcError;
      }

      if (leadResult && leadResult.length > 0) {
        const result = leadResult[0];
        contactId = result.lead_id;
        isNewLead = result.is_new;
        contactType = 'lead';
        console.log('Lead result:', {
          lead_id: contactId,
          is_new: isNewLead,
          temperature: result.lead_temperature,
          hot_substatus: result.lead_hot_substatus
        });

        // Apply message_received transition rules for incoming messages
        if (direction === 'in' && contactId) {
          await applyMessageReceivedRules(supabase, organizationId, contactId, result.lead_temperature, result.lead_hot_substatus, direction);
        }
      } else {
        console.error('No result from upsert_lead_by_phone');
        throw new Error('Failed to create or find lead');
      }
    }

    // Find or create conversation
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id, unread_count')
      .eq('phone', phoneWithCountry)
      .eq('channel', 'whatsapp')
      .eq('organization_id', organizationId)
      .maybeSingle();

    let conversationId: string;

    if (existingConversation) {
      conversationId = existingConversation.id;
      console.log('Found existing conversation:', conversationId);
      
      // Update conversation (only increment unread_count for incoming messages)
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: direction === 'in' 
            ? (existingConversation.unread_count || 0) + 1 
            : existingConversation.unread_count,
        })
        .eq('id', conversationId);

      if (updateError) {
        console.error('Error updating conversation:', updateError);
      }
    } else {
      // Create new conversation (only set unread_count for incoming messages)
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          contact_type: contactType,
          lead_id: contactType === 'lead' ? contactId : null,
          patient_id: contactType === 'patient' ? contactId : null,
          channel: 'whatsapp',
          evolution_instance: payload.instance,
          phone: phoneWithCountry,
          status: 'open',
          last_message_at: new Date().toISOString(),
          unread_count: direction === 'in' ? 1 : 0,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw convError;
      }

      conversationId = newConversation.id;
      console.log('Created new conversation:', conversationId);
    }

    // Create message using UPSERT to prevent duplicate key errors
    const messageData = {
      conversation_id: conversationId,
      direction: direction,
      type: messageType,
      content_text: messageText || null,
      media_url: mediaUrl,
      status: direction === 'in' ? 'received' : 'sent',
      provider_message_id: payload.data.key.id,
      raw_payload: payload,
      organization_id: organizationId,
    };

    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .upsert(messageData, { 
        onConflict: 'provider_message_id',
        ignoreDuplicates: true 
      })
      .select()
      .maybeSingle();

    // If upsert returned no data (duplicate ignored), fetch the existing message
    let messageId = newMessage?.id;
    if (!newMessage && !messageError) {
      const { data: existingMessage } = await supabase
        .from('messages')
        .select('id')
        .eq('provider_message_id', payload.data.key.id)
        .maybeSingle();
      
      messageId = existingMessage?.id;
      console.log('Duplicate message ignored, existing ID:', messageId);
    }

    if (messageError && !messageError.message?.includes('duplicate')) {
      console.error('Error creating message:', messageError);
      throw messageError;
    }

    console.log('Message processed successfully:', messageId);

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conversationId,
        lead_id: contactType === 'lead' ? contactId : null,
        patient_id: contactType === 'patient' ? contactId : null,
        message_id: messageId,
        is_new_lead: isNewLead,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
