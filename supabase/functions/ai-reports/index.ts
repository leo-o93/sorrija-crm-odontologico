import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  type: 'leads_analysis' | 'conversations_analysis' | 'performance_analysis' | 'recommendations' | 'full_report';
  organization_id: string;
  date_range?: {
    start: string;
    end: string;
  };
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

    const { type, organization_id, date_range }: ReportRequest = await req.json();

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

    console.log('[ai-reports] Generating report:', type, 'for org:', organization_id);

    // Calculate date range (default: last 30 days)
    const endDate = date_range?.end ? new Date(date_range.end) : new Date();
    const startDate = date_range?.start ? new Date(date_range.start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch real data from database
    const [
      { data: leads, error: leadsError },
      { data: conversations, error: convsError },
      { data: messages, error: msgsError },
      { data: appointments, error: apptsError },
      { data: sources, error: sourcesError },
      { data: procedures, error: procsError }
    ] = await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .eq('organization_id', organization_id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      supabase
        .from('conversations')
        .select('*')
        .eq('organization_id', organization_id)
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('messages')
        .select('*')
        .eq('organization_id', organization_id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('appointments')
        .select('*')
        .eq('organization_id', organization_id)
        .gte('date', startDate.toISOString().split('T')[0]),
      supabase
        .from('sources')
        .select('*')
        .eq('organization_id', organization_id),
      supabase
        .from('procedures')
        .select('*')
        .eq('organization_id', organization_id)
    ]);

    if (leadsError) console.error('[ai-reports] Leads error:', leadsError);
    if (convsError) console.error('[ai-reports] Conversations error:', convsError);

    // Calculate statistics from real data
    const stats = {
      total_leads: leads?.length || 0,
      leads_by_temperature: {
        quente: leads?.filter(l => l.temperature === 'quente').length || 0,
        morno: leads?.filter(l => l.temperature === 'morno').length || 0,
        frio: leads?.filter(l => l.temperature === 'frio').length || 0,
        novo: leads?.filter(l => l.temperature === 'novo').length || 0,
      },
      leads_by_substatus: {
        em_conversa: leads?.filter(l => l.hot_substatus === 'em_conversa').length || 0,
        aguardando_resposta: leads?.filter(l => l.hot_substatus === 'aguardando_resposta').length || 0,
        agendado: leads?.filter(l => l.hot_substatus === 'agendado').length || 0,
        negociacao: leads?.filter(l => l.hot_substatus === 'negociacao').length || 0,
        fechado: leads?.filter(l => l.hot_substatus === 'fechado').length || 0,
      },
      total_conversations: conversations?.length || 0,
      open_conversations: conversations?.filter(c => c.status === 'open').length || 0,
      total_messages: messages?.length || 0,
      messages_in: messages?.filter(m => m.direction === 'in').length || 0,
      messages_out: messages?.filter(m => m.direction === 'out').length || 0,
      appointments_scheduled: appointments?.filter(a => a.status === 'scheduled').length || 0,
      appointments_completed: appointments?.filter(a => a.status === 'completed').length || 0,
      appointments_cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
    };

    // Get hot leads with recent activity for priority analysis
    const hotLeads = leads?.filter(l => l.temperature === 'quente')
      .sort((a, b) => new Date(b.last_interaction_at || b.created_at).getTime() - new Date(a.last_interaction_at || a.created_at).getTime())
      .slice(0, 10)
      .map(l => ({
        name: l.name,
        phone: l.phone?.slice(-4), // Last 4 digits for privacy
        substatus: l.hot_substatus,
        last_interaction: l.last_interaction_at,
        interest: l.interest_id
      })) || [];

    // Calculate response time metrics
    const conversationsWithMessages = conversations?.filter(c => {
      const convMessages = messages?.filter(m => m.conversation_id === c.id);
      return convMessages && convMessages.length > 0;
    }) || [];

    // Leads without response in 24h
    const now = new Date();
    const staleLeads = leads?.filter(l => {
      if (!l.last_interaction_at) return true;
      const lastInteraction = new Date(l.last_interaction_at);
      const hoursSince = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);
      return hoursSince > 24 && l.temperature !== 'frio';
    }).length || 0;

    // Build prompt based on report type
    let systemPrompt = `Você é um analista de vendas e CRM especializado em clínicas odontológicas.
Sua função é analisar dados REAIS do banco de dados e fornecer insights acionáveis.
IMPORTANTE: Use SOMENTE os dados fornecidos. Não invente números ou informações.
Seja objetivo, direto e forneça recomendações práticas.
Responda em português brasileiro.`;

    let dataContext = `
DADOS DO PERÍODO: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}

ESTATÍSTICAS DE LEADS:
- Total de leads: ${stats.total_leads}
- Por temperatura:
  • Quentes: ${stats.leads_by_temperature.quente} (${stats.total_leads > 0 ? ((stats.leads_by_temperature.quente / stats.total_leads) * 100).toFixed(1) : 0}%)
  • Mornos: ${stats.leads_by_temperature.morno} (${stats.total_leads > 0 ? ((stats.leads_by_temperature.morno / stats.total_leads) * 100).toFixed(1) : 0}%)
  • Frios: ${stats.leads_by_temperature.frio} (${stats.total_leads > 0 ? ((stats.leads_by_temperature.frio / stats.total_leads) * 100).toFixed(1) : 0}%)
  • Novos: ${stats.leads_by_temperature.novo} (${stats.total_leads > 0 ? ((stats.leads_by_temperature.novo / stats.total_leads) * 100).toFixed(1) : 0}%)

- Por status (leads quentes):
  • Em conversa: ${stats.leads_by_substatus.em_conversa}
  • Aguardando resposta: ${stats.leads_by_substatus.aguardando_resposta}
  • Agendados: ${stats.leads_by_substatus.agendado}
  • Em negociação: ${stats.leads_by_substatus.negociacao}
  • Fechados: ${stats.leads_by_substatus.fechado}

CONVERSAS:
- Total: ${stats.total_conversations}
- Abertas: ${stats.open_conversations}
- Mensagens recebidas: ${stats.messages_in}
- Mensagens enviadas: ${stats.messages_out}

AGENDAMENTOS:
- Agendados: ${stats.appointments_scheduled}
- Realizados: ${stats.appointments_completed}
- Cancelados: ${stats.appointments_cancelled}

ALERTAS:
- Leads sem resposta há +24h: ${staleLeads}

LEADS QUENTES PRIORITÁRIOS:
${hotLeads.map((l, i) => `${i + 1}. ${l.name} (***${l.phone}) - ${l.substatus || 'sem status'}`).join('\n')}
`;

    let userPrompt = '';

    switch (type) {
      case 'leads_analysis':
        userPrompt = `${dataContext}

Forneça uma análise completa dos leads com:
1. DIAGNÓSTICO GERAL: Avaliação da saúde do funil de vendas
2. PONTOS DE ATENÇÃO: Problemas identificados que precisam de ação imediata
3. LEADS PRIORITÁRIOS: Quais leads devem ser contatados primeiro e por quê
4. TAXA DE CONVERSÃO: Análise da conversão de leads novos para quentes
5. RECOMENDAÇÕES: 3-5 ações práticas para melhorar os resultados

Formate como JSON com as chaves: diagnostico, pontos_atencao (array), leads_prioritarios (array com nome e motivo), taxa_conversao (objeto com valor e analise), recomendacoes (array)`;
        break;

      case 'conversations_analysis':
        userPrompt = `${dataContext}

Analise a qualidade das conversas e forneça:
1. ENGAJAMENTO: Nível de interação com os leads
2. TEMPO DE RESPOSTA: Análise baseada em leads sem resposta
3. CONVERSAS ESTAGNADAS: Quantas conversas abertas sem progresso
4. PADRÕES: O que funciona bem nas conversas
5. MELHORIAS: Como melhorar a comunicação

Formate como JSON com as chaves: engajamento (objeto com nivel e analise), tempo_resposta (objeto), conversas_estagnadas (numero e lista), padroes_sucesso (array), melhorias (array)`;
        break;

      case 'performance_analysis':
        userPrompt = `${dataContext}

Analise a performance da equipe:
1. PRODUTIVIDADE: Volume de atividades (mensagens, agendamentos)
2. EFETIVIDADE: Taxa de conversão de conversas para agendamentos
3. PONTOS FORTES: O que está funcionando bem
4. PONTOS FRACOS: Onde há oportunidade de melhoria
5. METAS SUGERIDAS: KPIs e metas para próximo período

Formate como JSON com as chaves: produtividade (objeto), efetividade (objeto com taxa e analise), pontos_fortes (array), pontos_fracos (array), metas_sugeridas (array com meta e valor)`;
        break;

      case 'recommendations':
        userPrompt = `${dataContext}

Forneça recomendações estratégicas:
1. AÇÕES IMEDIATAS: O que fazer hoje/amanhã (urgente)
2. AÇÕES DE CURTO PRAZO: Próximos 7 dias
3. AÇÕES DE MÉDIO PRAZO: Próximos 30 dias
4. OPORTUNIDADES: Potencial de receita identificado
5. RISCOS: Leads em risco de perda

Formate como JSON com as chaves: acoes_imediatas (array com acao e impacto), acoes_curto_prazo (array), acoes_medio_prazo (array), oportunidades (objeto com descricao e valor_estimado), riscos (array com lead e risco)`;
        break;

      case 'full_report':
      default:
        userPrompt = `${dataContext}

Gere um relatório executivo completo com:

1. RESUMO EXECUTIVO: Visão geral da situação em 2-3 frases

2. DIAGNÓSTICO DO FUNIL:
- Saúde geral do funil (1-10)
- Gargalos identificados
- Taxa de conversão estimada

3. LEADS PRIORITÁRIOS (Top 5):
- Nome e motivo para priorizar

4. PROBLEMAS CRÍTICOS:
- Listar problemas que precisam ação imediata

5. RECOMENDAÇÕES:
- 5 ações práticas ordenadas por impacto

6. PREVISÃO:
- Estimativa de fechamentos possíveis baseado nos dados

Formate como JSON com as chaves: resumo_executivo, diagnostico_funil (objeto com saude, gargalos array, taxa_conversao), leads_prioritarios (array), problemas_criticos (array), recomendacoes (array com acao, impacto e prazo), previsao (objeto)`;
        break;
    }

    console.log('[ai-reports] Calling AI with data context...');

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
      console.error('[ai-reports] AI API error:', errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Tente novamente em alguns segundos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos em Settings -> Workspace -> Usage.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const reportText = data.choices?.[0]?.message?.content || '';
    
    console.log('[ai-reports] Raw response length:', reportText.length);

    // Parse JSON from response
    let report;
    try {
      const cleanJson = reportText.replace(/```json\n?|\n?```/g, '').trim();
      report = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('[ai-reports] JSON parse error, returning raw text');
      report = { raw_analysis: reportText };
    }

    return new Response(JSON.stringify({ 
      success: true,
      type,
      stats,
      report,
      generated_at: new Date().toISOString(),
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-reports] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
