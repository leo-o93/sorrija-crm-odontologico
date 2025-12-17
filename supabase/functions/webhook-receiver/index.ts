import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret, x-webhook-signature, x-organization-id',
};

// Maximum payload size (1MB)
const MAX_PAYLOAD_SIZE = 1024 * 1024;

// Simple in-memory rate limiting (per IP, resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

function checkRateLimit(ipAddress: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ipAddress);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ipAddress, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Verify HMAC signature
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Constant-time comparison
    if (signature.length !== computedSignature.length) return false;
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ computedSignature.charCodeAt(i);
    }
    return result === 0;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Sanitize payload by removing potentially dangerous keys
function sanitizePayload(payload: any): any {
  if (typeof payload !== 'object' || payload === null) {
    return payload;
  }
  
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  if (Array.isArray(payload)) {
    return payload.map(sanitizePayload);
  }
  
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!dangerousKeys.includes(key.toLowerCase())) {
      sanitized[key] = sanitizePayload(value);
    }
  }
  return sanitized;
}

// Sanitize headers by removing sensitive ones from storage
function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sensitiveHeaders = [
    'authorization', 'cookie', 'set-cookie', 'x-api-key', 
    'x-webhook-secret', 'x-webhook-signature', 'apikey'
  ];
  
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Webhook received:', req.method, req.url);

    const url = new URL(req.url);
    
    // Collect headers
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Extract IP address for rate limiting
    const ipAddress = headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                      headers['x-real-ip'] || 
                      'unknown';

    // Check rate limit
    if (!checkRateLimit(ipAddress)) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ipAddress}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Try again later.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } 
        }
      );
    }

    // Check content length before reading body
    const contentLength = parseInt(headers['content-length'] || '0', 10);
    if (contentLength > MAX_PAYLOAD_SIZE) {
      console.warn(`⚠️ Payload too large: ${contentLength} bytes`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Payload too large. Maximum size is ${MAX_PAYLOAD_SIZE / 1024 / 1024}MB` 
        }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get webhook secret for signature verification
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    
    // Authentication: Check for secret header or signature
    const providedSecret = headers['x-webhook-secret'];
    const providedSignature = headers['x-webhook-signature'];
    
    // If webhook secret is configured, require authentication
    if (webhookSecret) {
      // Method 1: Direct secret comparison
      if (providedSecret) {
        if (providedSecret !== webhookSecret) {
          console.warn(`⚠️ Invalid webhook secret from IP: ${ipAddress}`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Invalid webhook secret' 
            }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        console.log('✅ Webhook authenticated via secret header');
      } 
      // Method 2: HMAC signature verification (will verify after reading body)
      else if (!providedSignature) {
        console.warn(`⚠️ Missing authentication from IP: ${ipAddress}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Authentication required. Provide X-Webhook-Secret or X-Webhook-Signature header.' 
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Read and validate body
    let bodyText = '';
    let payload: any = null;
    const contentType = req.headers.get('content-type') || '';
    
    try {
      bodyText = await req.text();
      
      // Enforce size limit on actual body
      if (bodyText.length > MAX_PAYLOAD_SIZE) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Payload too large. Maximum size is ${MAX_PAYLOAD_SIZE / 1024 / 1024}MB` 
          }),
          { 
            status: 413, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Verify HMAC signature if provided
      if (webhookSecret && providedSignature && !providedSecret) {
        const isValid = await verifySignature(bodyText, providedSignature, webhookSecret);
        if (!isValid) {
          console.warn(`⚠️ Invalid webhook signature from IP: ${ipAddress}`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Invalid webhook signature' 
            }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        console.log('✅ Webhook authenticated via HMAC signature');
      }

      // Parse payload based on content type
      if (contentType.includes('application/json') && bodyText) {
        payload = JSON.parse(bodyText);
        payload = sanitizePayload(payload);
      } else if (contentType.includes('application/x-www-form-urlencoded') && bodyText) {
        const params = new URLSearchParams(bodyText);
        payload = sanitizePayload(Object.fromEntries(params));
      } else if (contentType.includes('text/') && bodyText) {
        payload = { text: bodyText };
      } else if (bodyText) {
        payload = { raw: bodyText };
      } else {
        payload = { empty: true };
      }
    } catch (parseError) {
      console.error('❌ Error parsing body:', parseError);
      payload = { error: 'Unable to parse body', raw: bodyText.substring(0, 1000) };
    }

    // Extract query params
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Get organization_id from header or query param
    const organizationId = headers['x-organization-id'] || queryParams['organization_id'] || null;

    // Additional info
    const userAgent = headers['user-agent'] || 'unknown';
    const origin = headers['origin'] || headers['referer'] || 'unknown';

    // Save to database with sanitized data
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
        method: req.method,
        path: url.pathname,
        origin,
        headers: sanitizeHeaders(headers),
        query_params: Object.keys(queryParams).length > 0 ? queryParams : null,
        payload,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'received',
        organization_id: organizationId,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving webhook:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to save webhook'
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
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
