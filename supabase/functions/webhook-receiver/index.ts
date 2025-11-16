import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Webhook received:', req.method, req.url);

    // Collect all request information
    const url = new URL(req.url);
    const method = req.method;
    const headers: Record<string, string> = {};
    
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Extract query params
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Read the body
    let payload: any = null;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      payload = Object.fromEntries(formData);
    } else if (contentType.includes('text/')) {
      payload = { text: await req.text() };
    } else {
      // For other types, try to read as text
      try {
        const text = await req.text();
        payload = { raw: text };
      } catch {
        payload = { error: 'Unable to parse body' };
      }
    }

    // Extract additional information
    const ipAddress = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
    const userAgent = headers['user-agent'] || 'unknown';
    const origin = headers['origin'] || headers['referer'] || 'unknown';

    // Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        method,
        path: url.pathname,
        origin,
        headers,
        query_params: Object.keys(queryParams).length > 0 ? queryParams : null,
        payload,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'received',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving webhook:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to save webhook',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Webhook saved successfully:', data.id);

    // Respond with success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook received and stored',
        webhook_id: data.id,
        received_at: data.created_at
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
