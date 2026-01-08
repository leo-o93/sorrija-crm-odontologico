CREATE OR REPLACE FUNCTION public.get_sales_dashboard_data(
  p_organization_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  previous_start date := (p_start_date - interval '1 month')::date;
  previous_end date := (p_end_date - interval '1 month')::date;
  six_months_ago date := (p_start_date - interval '5 months')::date;
  result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.get_user_organization_ids() AS org_id
    WHERE org_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Organization not allowed';
  END IF;

  WITH current_leads AS (
    SELECT
      l.id,
      l.status,
      l.scheduled,
      l.temperature,
      l.hot_substatus,
      l.evaluation_result,
      l.budget_total,
      l.registration_date,
      s.name AS source_name,
      p.name AS interest_name
    FROM public.leads l
    LEFT JOIN public.sources s ON s.id = l.source_id
    LEFT JOIN public.procedures p ON p.id = l.interest_id
    WHERE l.organization_id = p_organization_id
      AND l.registration_date BETWEEN p_start_date AND p_end_date
  ),
  totals AS (
    SELECT
      COUNT(*) AS total_leads,
      COUNT(*) FILTER (WHERE temperature = 'novo' OR temperature IS NULL) AS temp_novo,
      COUNT(*) FILTER (WHERE temperature = 'quente') AS temp_quente,
      COUNT(*) FILTER (WHERE temperature = 'frio') AS temp_frio,
      COUNT(*) FILTER (WHERE temperature = 'perdido') AS temp_perdido,
      COUNT(*) FILTER (
        WHERE temperature = 'quente'
          AND (hot_substatus = 'em_conversa' OR hot_substatus IS NULL)
      ) AS hot_em_conversa,
      COUNT(*) FILTER (
        WHERE temperature = 'quente'
          AND hot_substatus = 'aguardando_resposta'
      ) AS hot_aguardando_resposta,
      COUNT(*) FILTER (
        WHERE temperature = 'quente'
          AND hot_substatus = 'em_negociacao'
      ) AS hot_em_negociacao,
      COUNT(*) FILTER (
        WHERE temperature = 'quente'
          AND hot_substatus = 'follow_up_agendado'
      ) AS hot_follow_up_agendado,
      COUNT(*) FILTER (WHERE scheduled) AS scheduled_leads,
      COUNT(*) FILTER (WHERE status <> 'novo_lead') AS leads_contacted,
      COUNT(*) FILTER (
        WHERE scheduled
          OR status IN ('agendado', 'compareceu', 'fechado')
      ) AS leads_scheduled,
      COUNT(*) FILTER (
        WHERE status IN ('compareceu', 'fechado')
          OR evaluation_result = 'Fechou'
      ) AS leads_attended,
      COUNT(*) FILTER (
        WHERE status = 'fechado'
          OR evaluation_result = 'Fechou'
      ) AS leads_closed
    FROM current_leads
  ),
  revenue AS (
    SELECT COALESCE(SUM(amount), 0) AS monthly_revenue
    FROM public.financial_transactions
    WHERE organization_id = p_organization_id
      AND type = 'receita'
      AND status = 'paid'
      AND transaction_date BETWEEN p_start_date AND p_end_date
  ),
  previous AS (
    SELECT
      (SELECT COUNT(*)
       FROM public.leads
       WHERE organization_id = p_organization_id
         AND registration_date BETWEEN previous_start AND previous_end) AS previous_total_leads,
      (SELECT COALESCE(SUM(amount), 0)
       FROM public.financial_transactions
       WHERE organization_id = p_organization_id
         AND type = 'receita'
         AND status = 'paid'
         AND transaction_date BETWEEN previous_start AND previous_end) AS previous_revenue
  ),
  interest AS (
    SELECT COALESCE(
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'name', name,
          'value', value,
          'percentage', percentage
        ) ORDER BY value DESC
      ),
      '[]'::jsonb
    ) AS leads_by_interest
    FROM (
      SELECT
        COALESCE(interest_name, 'Sem interesse') AS name,
        COUNT(*) AS value,
        CASE
          WHEN totals.total_leads > 0
            THEN (COUNT(*)::numeric / totals.total_leads) * 100
          ELSE 0
        END AS percentage
      FROM current_leads
      CROSS JOIN totals
      GROUP BY name, totals.total_leads
      ORDER BY value DESC
      LIMIT 6
    ) ranked
  ),
  sources AS (
    SELECT COALESCE(
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'name', name,
          'value', value,
          'percentage', percentage
        ) ORDER BY value DESC
      ),
      '[]'::jsonb
    ) AS leads_by_source
    FROM (
      SELECT
        COALESCE(source_name, 'Sem fonte') AS name,
        COUNT(*) AS value,
        CASE
          WHEN totals.total_leads > 0
            THEN (COUNT(*)::numeric / totals.total_leads) * 100
          ELSE 0
        END AS percentage
      FROM current_leads
      CROSS JOIN totals
      GROUP BY name, totals.total_leads
      ORDER BY value DESC
      LIMIT 6
    ) ranked
  ),
  months AS (
    SELECT DATE_TRUNC('month', d)::date AS month_start
    FROM GENERATE_SERIES(
      DATE_TRUNC('month', six_months_ago)::date,
      DATE_TRUNC('month', p_end_date)::date,
      INTERVAL '1 month'
    ) AS d
  ),
  monthly AS (
    SELECT
      m.month_start,
      COUNT(l.id) AS leads,
      COALESCE(SUM(CASE WHEN l.status = 'fechado' THEN l.budget_total ELSE 0 END), 0) AS revenue,
      COUNT(l.id) FILTER (WHERE l.scheduled) AS scheduled
    FROM months m
    LEFT JOIN public.leads l
      ON l.organization_id = p_organization_id
      AND l.registration_date >= m.month_start
      AND l.registration_date <= (m.month_start + INTERVAL '1 month - 1 day')
    GROUP BY m.month_start
    ORDER BY m.month_start
  ),
  monthly_agg AS (
    SELECT COALESCE(
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'month', TO_CHAR(monthly.month_start, 'FMMon/YY'),
          'leads', monthly.leads,
          'revenue', monthly.revenue,
          'scheduled', monthly.scheduled
        ) ORDER BY monthly.month_start
      ),
      '[]'::jsonb
    ) AS monthly_evolution
    FROM monthly
  )
  SELECT JSONB_BUILD_OBJECT(
    'leadsByTemperature', JSONB_BUILD_OBJECT(
      'novo', totals.temp_novo,
      'quente', totals.temp_quente,
      'frio', totals.temp_frio,
      'perdido', totals.temp_perdido
    ),
    'hotSubstatus', JSONB_BUILD_OBJECT(
      'em_conversa', totals.hot_em_conversa,
      'aguardando_resposta', totals.hot_aguardando_resposta,
      'em_negociacao', totals.hot_em_negociacao,
      'follow_up_agendado', totals.hot_follow_up_agendado
    ),
    'scheduledLeads', totals.scheduled_leads,
    'unscheduledLeads', totals.total_leads - totals.scheduled_leads,
    'schedulingRate', CASE
      WHEN totals.total_leads > 0
        THEN (totals.scheduled_leads::numeric / totals.total_leads) * 100
      ELSE 0
    END,
    'totalLeads', totals.total_leads,
    'leadsContacted', totals.leads_contacted,
    'leadsScheduled', totals.leads_scheduled,
    'leadsAttended', totals.leads_attended,
    'leadsClosed', totals.leads_closed,
    'monthlyRevenue', revenue.monthly_revenue,
    'averageTicket', CASE
      WHEN totals.leads_closed > 0
        THEN revenue.monthly_revenue / totals.leads_closed
      ELSE 0
    END,
    'leadsGrowth', CASE
      WHEN previous.previous_total_leads > 0
        THEN ((totals.total_leads - previous.previous_total_leads)::numeric / previous.previous_total_leads) * 100
      ELSE 0
    END,
    'revenueGrowth', CASE
      WHEN previous.previous_revenue > 0
        THEN ((revenue.monthly_revenue - previous.previous_revenue)::numeric / previous.previous_revenue) * 100
      ELSE 0
    END,
    'leadsByInterest', interest.leads_by_interest,
    'leadsBySource', sources.leads_by_source,
    'monthlyEvolution', monthly_agg.monthly_evolution
  )
  INTO result
  FROM totals
  CROSS JOIN revenue
  CROSS JOIN previous
  CROSS JOIN interest
  CROSS JOIN sources
  CROSS JOIN monthly_agg;

  RETURN result;
END;
$$;
