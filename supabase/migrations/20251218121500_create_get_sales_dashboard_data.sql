-- Create RPC for sales dashboard data
CREATE OR REPLACE FUNCTION public.get_sales_dashboard_data(
  p_organization_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
WITH current_leads AS (
  SELECT
    l.*,
    s.name AS source_name,
    p.name AS procedure_name
  FROM public.leads l
  LEFT JOIN public.sources s ON s.id = l.source_id
  LEFT JOIN public.procedures p ON p.id = l.interest_id
  WHERE l.organization_id = p_organization_id
    AND l.registration_date >= p_start_date
    AND l.registration_date <= p_end_date
),
previous_leads AS (
  SELECT l.id
  FROM public.leads l
  WHERE l.organization_id = p_organization_id
    AND l.registration_date >= (p_start_date - INTERVAL '1 month')
    AND l.registration_date <= (p_end_date - INTERVAL '1 month')
),
current_transactions AS (
  SELECT amount
  FROM public.financial_transactions
  WHERE organization_id = p_organization_id
    AND type = 'receita'
    AND status = 'paid'
    AND transaction_date >= p_start_date
    AND transaction_date <= p_end_date
),
previous_transactions AS (
  SELECT amount
  FROM public.financial_transactions
  WHERE organization_id = p_organization_id
    AND type = 'receita'
    AND status = 'paid'
    AND transaction_date >= (p_start_date - INTERVAL '1 month')
    AND transaction_date <= (p_end_date - INTERVAL '1 month')
),
evolution_leads AS (
  SELECT l.*
  FROM public.leads l
  WHERE l.organization_id = p_organization_id
    AND l.registration_date >= (date_trunc('month', p_start_date)::date - INTERVAL '5 months')
    AND l.registration_date <= p_end_date
),
metrics AS (
  SELECT
    COUNT(*)::int AS total_leads,
    COUNT(*) FILTER (WHERE status <> 'novo_lead')::int AS leads_contacted,
    COUNT(*) FILTER (
      WHERE scheduled
        OR status IN ('agendado', 'compareceu', 'avaliacao', 'orcamento_enviado', 'pos_consulta', 'fechado')
    )::int AS leads_scheduled,
    COUNT(*) FILTER (
      WHERE status IN ('compareceu', 'avaliacao', 'orcamento_enviado', 'pos_consulta', 'fechado')
        OR evaluation_result = 'Fechou'
    )::int AS leads_attended,
    COUNT(*) FILTER (WHERE status = 'fechado' OR evaluation_result = 'Fechou')::int AS leads_closed,
    COUNT(*) FILTER (WHERE scheduled)::int AS scheduled_leads
  FROM current_leads
),
interest_counts AS (
  SELECT COALESCE(procedure_name, 'Sem interesse') AS name, COUNT(*)::int AS value
  FROM current_leads
  GROUP BY COALESCE(procedure_name, 'Sem interesse')
),
source_counts AS (
  SELECT COALESCE(source_name, 'Sem fonte') AS name, COUNT(*)::int AS value
  FROM current_leads
  GROUP BY COALESCE(source_name, 'Sem fonte')
),
monthly_evolution AS (
  SELECT
    month_start,
    to_char(month_start, 'Mon/YY') AS label,
    COUNT(l.id)::int AS leads,
    COALESCE(SUM(CASE WHEN l.status = 'fechado' THEN COALESCE(l.budget_total, 0) ELSE 0 END), 0) AS revenue,
    COUNT(l.id) FILTER (WHERE l.scheduled)::int AS scheduled
  FROM generate_series(
    date_trunc('month', p_start_date)::date - INTERVAL '5 months',
    date_trunc('month', p_end_date)::date,
    INTERVAL '1 month'
  ) AS month_start
  LEFT JOIN evolution_leads l
    ON date_trunc('month', l.registration_date) = date_trunc('month', month_start)
  GROUP BY month_start
  ORDER BY month_start
)
SELECT jsonb_build_object(
  'leadsByTemperature', jsonb_build_object(
    'novo', (SELECT COUNT(*)::int FROM current_leads WHERE temperature = 'novo' OR temperature IS NULL),
    'quente', (SELECT COUNT(*)::int FROM current_leads WHERE temperature = 'quente'),
    'frio', (SELECT COUNT(*)::int FROM current_leads WHERE temperature = 'frio'),
    'perdido', (SELECT COUNT(*)::int FROM current_leads WHERE temperature = 'perdido')
  ),
  'hotSubstatus', jsonb_build_object(
    'em_conversa', (SELECT COUNT(*)::int FROM current_leads WHERE temperature = 'quente' AND (hot_substatus = 'em_conversa' OR hot_substatus IS NULL)),
    'aguardando_resposta', (SELECT COUNT(*)::int FROM current_leads WHERE temperature = 'quente' AND hot_substatus = 'aguardando_resposta'),
    'em_negociacao', (SELECT COUNT(*)::int FROM current_leads WHERE temperature = 'quente' AND hot_substatus = 'em_negociacao'),
    'follow_up_agendado', (SELECT COUNT(*)::int FROM current_leads WHERE temperature = 'quente' AND hot_substatus = 'follow_up_agendado')
  ),
  'scheduledLeads', (SELECT scheduled_leads FROM metrics),
  'unscheduledLeads', (SELECT total_leads - scheduled_leads FROM metrics),
  'schedulingRate', CASE WHEN (SELECT total_leads FROM metrics) > 0
    THEN ROUND(((SELECT scheduled_leads FROM metrics)::numeric / (SELECT total_leads FROM metrics) * 100), 2)
    ELSE 0 END,
  'totalLeads', (SELECT total_leads FROM metrics),
  'leadsContacted', (SELECT leads_contacted FROM metrics),
  'leadsScheduled', (SELECT leads_scheduled FROM metrics),
  'leadsAttended', (SELECT leads_attended FROM metrics),
  'leadsClosed', (SELECT leads_closed FROM metrics),
  'monthlyRevenue', COALESCE((SELECT SUM(amount) FROM current_transactions), 0),
  'averageTicket', CASE WHEN (SELECT leads_closed FROM metrics) > 0
    THEN COALESCE((SELECT SUM(amount) FROM current_transactions), 0) / (SELECT leads_closed FROM metrics)
    ELSE 0 END,
  'leadsGrowth', CASE WHEN (SELECT COUNT(*) FROM previous_leads) > 0
    THEN (((SELECT total_leads FROM metrics) - (SELECT COUNT(*) FROM previous_leads))::numeric / (SELECT COUNT(*) FROM previous_leads) * 100)
    ELSE 0 END,
  'revenueGrowth', CASE WHEN COALESCE((SELECT SUM(amount) FROM previous_transactions), 0) > 0
    THEN (((COALESCE((SELECT SUM(amount) FROM current_transactions), 0)) - (COALESCE((SELECT SUM(amount) FROM previous_transactions), 0)))
      / COALESCE((SELECT SUM(amount) FROM previous_transactions), 0) * 100)
    ELSE 0 END,
  'leadsByInterest', COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', name,
        'value', value,
        'percentage', CASE WHEN (SELECT total_leads FROM metrics) > 0
          THEN ROUND((value::numeric / (SELECT total_leads FROM metrics) * 100), 2)
          ELSE 0 END
      )
      ORDER BY value DESC
    )
    FROM (
      SELECT * FROM interest_counts ORDER BY value DESC LIMIT 6
    ) interest_top
  ), '[]'::jsonb),
  'leadsBySource', COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', name,
        'value', value,
        'percentage', CASE WHEN (SELECT total_leads FROM metrics) > 0
          THEN ROUND((value::numeric / (SELECT total_leads FROM metrics) * 100), 2)
          ELSE 0 END
      )
      ORDER BY value DESC
    )
    FROM (
      SELECT * FROM source_counts ORDER BY value DESC LIMIT 6
    ) source_top
  ), '[]'::jsonb),
  'monthlyEvolution', COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'month', label,
        'leads', leads,
        'revenue', revenue,
        'scheduled', scheduled
      )
      ORDER BY month_start
    )
    FROM monthly_evolution
  ), '[]'::jsonb)
);
$$;
