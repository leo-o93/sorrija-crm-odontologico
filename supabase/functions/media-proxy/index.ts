import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { message_id } = await req.json();
    
    if (!message_id) {
      return new Response(JSON.stringify({ error: 'message_id required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[media-proxy] Processing message: ${message_id}`);

    // Fetch the message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select('*, conversations(organization_id, evolution_instance)')
      .eq('id', message_id)
      .single();

    if (msgError || !message) {
      console.error('[media-proxy] Message not found:', msgError);
      return new Response(JSON.stringify({ error: 'Message not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check if already has permanent URL
    if (message.media_url && !message.media_url.includes('mmg.whatsapp.net')) {
      console.log('[media-proxy] Already has permanent URL');
      return new Response(JSON.stringify({ url: message.media_url }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get integration settings
    const organizationId = message.conversations?.organization_id;
    const instanceName = message.conversations?.evolution_instance;

    if (!organizationId || !instanceName) {
      return new Response(JSON.stringify({ error: 'Missing organization or instance info' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { data: settings, error: settingsError } = await supabase
      .from('integration_settings')
      .select('settings')
      .eq('organization_id', organizationId)
      .eq('integration_type', 'whatsapp_evolution')
      .eq('active', true)
      .single();

    if (settingsError || !settings) {
      console.error('[media-proxy] Settings not found:', settingsError);
      return new Response(JSON.stringify({ error: 'Evolution settings not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const evolutionUrl = settings.settings?.evolution_base_url;
    const evolutionKey = settings.settings?.evolution_api_key;

    if (!evolutionUrl || !evolutionKey) {
      return new Response(JSON.stringify({ error: 'Evolution API not configured' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Extract message key from raw_payload
    const rawPayload = message.raw_payload;
    const messageKey = rawPayload?.data?.key || rawPayload?.key;

    if (!messageKey) {
      console.error('[media-proxy] No message key in raw_payload');
      return new Response(JSON.stringify({ error: 'No message key available' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[media-proxy] Fetching media from Evolution API`);

    // Call Evolution API to get base64 media
    const evolutionResponse = await fetch(
      `${evolutionUrl}/chat/getBase64FromMediaMessage/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify({
          message: { key: messageKey },
          convertToMp4: false,
        }),
      }
    );

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text();
      console.error('[media-proxy] Evolution API error:', errorText);
      
      // Check if it's a 403, 404 or 410 error (media expired or not found)
      const isMediaExpired = errorText.includes('403') || 
                            errorText.includes('Forbidden') ||
                            errorText.includes('404') ||
                            errorText.includes('Not Found') ||
                            errorText.includes('410') ||
                            errorText.includes('Gone');
      
      if (isMediaExpired) {
        console.log('[media-proxy] Media expired or not found, returning expired status');
        // Return 200 with error field so SDK doesn't throw
        return new Response(JSON.stringify({ 
          error: 'media_expired',
          expired: true,
          message: 'Mídia expirada ou indisponível. O WhatsApp remove mídias após ~48h.'
        }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      return new Response(JSON.stringify({ error: 'Failed to fetch media from Evolution' }), { 
        status: 502, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const mediaData = await evolutionResponse.json();
    const base64Data = mediaData.base64;
    const mimeType = mediaData.mimetype || 'application/octet-stream';

    if (!base64Data) {
      console.error('[media-proxy] No base64 data returned');
      return new Response(JSON.stringify({ error: 'No media data returned' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Decode base64 to binary
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Determine file extension
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'application/pdf': 'pdf',
    };
    const ext = extMap[mimeType] || 'bin';
    const fileName = `${message_id}.${ext}`;
    const filePath = `${organizationId}/${fileName}`;

    console.log(`[media-proxy] Uploading to storage: ${filePath}`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('whatsapp-media')
      .upload(filePath, binaryData, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[media-proxy] Storage upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload to storage' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('whatsapp-media')
      .getPublicUrl(filePath);

    const permanentUrl = publicUrlData.publicUrl;

    console.log(`[media-proxy] Updating message with permanent URL: ${permanentUrl}`);

    // Update message with permanent URL
    const { error: updateError } = await supabase
      .from('messages')
      .update({ media_url: permanentUrl })
      .eq('id', message_id);

    if (updateError) {
      console.error('[media-proxy] Message update error:', updateError);
    }

    return new Response(JSON.stringify({ url: permanentUrl }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    console.error('[media-proxy] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
