-- Fix SECURITY DEFINER function: create_default_transition_rules
-- Add explicit caller authorization check

CREATE OR REPLACE FUNCTION public.create_default_transition_rules(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_caller_id UUID;
BEGIN
  -- Get the caller's user ID
  v_caller_id := auth.uid();
  
  -- Authorization check: Verify caller is a member of the target organization or super admin
  IF v_caller_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = v_caller_id 
        AND organization_id = org_id 
        AND active = true
        AND role IN ('admin', 'gerente')
    ) AND NOT EXISTS (
      SELECT 1 FROM public.super_admins 
      WHERE user_id = v_caller_id
    ) THEN
      RAISE EXCEPTION 'Access denied: not authorized to create transition rules for organization %', org_id;
    END IF;
  END IF;

  -- Create default transition rules for the organization
  INSERT INTO temperature_transition_rules 
    (organization_id, name, trigger_event, from_temperature, condition_message_direction, 
     action_set_temperature, action_set_substatus, timer_minutes, priority, active)
  VALUES 
    (org_id, 'Ativar lead ao receber mensagem', 'message_received', 'novo', 'in', 
     'quente', 'em_conversa', 0, 1, true),
    (org_id, 'Reativar lead frio ao receber mensagem', 'message_received', 'frio', 'in', 
     'quente', 'em_conversa', 0, 2, true),
    (org_id, 'Manter engajamento ativo', 'message_received', 'quente', 'in', 
     NULL, 'em_conversa', 0, 3, true),
    (org_id, 'Lead novo inativo -> Frio', 'inactivity_timer', 'novo', NULL, 
     'frio', NULL, 1440, 4, true),
    (org_id, 'Lead quente inativo -> Frio', 'inactivity_timer', 'quente', NULL, 
     'frio', NULL, 2880, 5, true),
    (org_id, 'Timeout aguardando resposta', 'substatus_timeout', 'quente', NULL, 
     NULL, NULL, 4320, 6, true)
  ON CONFLICT DO NOTHING;
END;
$function$;