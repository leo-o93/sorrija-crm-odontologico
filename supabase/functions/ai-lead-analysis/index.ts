import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  message_text: string;
  lead_id?: string;
  conversation_history?: Array<{ role: string; content: string }>;
  organization_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { message_text, lead_id, conversation_history, organization_id }: AnalysisRequest = await req.json();

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: 'Organization ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .eq('active', true)
      .maybeSingle();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: 'Access denied: not a member of this organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ai-lead-analysis] Analyzing message for org:', organization_id);

    // Fetch available procedures/interests for context
    const { data: procedures } = await supabase
      .from('procedures')
      .select('id, name')
      .eq('organization_id', organization_id)
      .eq('active', true);

    const proceduresList = procedures?.map(p => p.name).join(', ') || 'Não especificados';

    // Build conversation context
    let conversationContext = '';
    if (conversation_history && conversation_history.length > 0) {
      conversationContext = conversation_history
        .slice(-10) // Last 10 messages for context
        .map(m => `${m.role === 'in' ? 'Cliente' : 'Atendente'}: ${m.content}`)
        .join('\n');
    }

    const systemPrompt = `Você é um analista de vendas especializado em clínicas odontológicas.
Sua função é analisar mensagens de WhatsApp e classificar leads.

Procedimentos disponíveis na clínica: ${proceduresList}

Analise a mensagem/conversa e retorne um JSON com:
- interest: qual procedimento o cliente demonstrou interesse (ou "não_identificado")
- temperature: "quente" (demonstrou interesse claro, perguntou valores, quer agendar), "morno" (tem interesse mas está pesquisando), "frio" (apenas curiosidade, sem intenção de compra), "novo" (primeiro contato, ainda sem contexto suficiente)
- intent: "agendar" | "informacao" | "orcamento" | "duvida" | "reclamacao" | "outro"
- urgency: "alta" (quer para hoje/amanhã), "media" (próximos dias), "baixa" (sem pressa)
- sentiment: "positivo" | "neutro" | "negativo"
- suggested_action: sugestão de próximo passo para o atendente
- reasoning: explicação breve da classificação

Responda APENAS com o JSON, sem markdown ou texto adicional.`;

    const userPrompt = conversationContext 
      ? `Histórico da conversa:\n${conversationContext}\n\nÚltima mensagem do cliente:\n${message_text}`
      : `Mensagem do cliente:\n${message_text}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ai-lead-analysis] AI API error:', errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content || '';
    
    console.log('[ai-lead-analysis] Raw response:', analysisText);

    // Parse JSON from response
    let analysis;
    try {
      // Clean up response if it has markdown
      const cleanJson = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('[ai-lead-analysis] JSON parse error:', parseError);
      analysis = {
        interest: 'não_identificado',
        temperature: 'novo',
        intent: 'outro',
        urgency: 'baixa',
        sentiment: 'neutro',
        suggested_action: 'Fazer primeiro contato e entender necessidade',
        reasoning: 'Não foi possível analisar a mensagem automaticamente'
      };
    }

    console.log('[ai-lead-analysis] Analysis result:', analysis);

    return new Response(JSON.stringify({ 
      success: true,
      analysis,
      lead_id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-lead-analysis] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
