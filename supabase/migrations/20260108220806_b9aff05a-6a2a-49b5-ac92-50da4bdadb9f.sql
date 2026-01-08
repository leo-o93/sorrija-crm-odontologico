-- Create temperature transition rules table
CREATE TABLE public.temperature_transition_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  
  -- Condition: WHEN to apply this rule
  trigger_event TEXT NOT NULL, -- 'inactivity_timer', 'substatus_timeout', 'no_response'
  from_temperature TEXT, -- 'novo', 'quente', 'frio' or NULL for any
  from_substatus TEXT, -- 'em_conversa', 'aguardando_resposta' or NULL
  
  -- Timer in minutes
  timer_minutes INTEGER NOT NULL,
  
  -- Action: WHAT to do
  action_set_temperature TEXT, -- 'quente', 'frio' or NULL to not change
  action_clear_substatus BOOLEAN DEFAULT false,
  action_set_substatus TEXT, -- New substatus or NULL
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.temperature_transition_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage temperature transition rules" 
ON public.temperature_transition_rules 
FOR ALL 
USING (
  organization_id IN (SELECT get_user_organization_ids()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
);

CREATE POLICY "Users can view temperature transition rules" 
ON public.temperature_transition_rules 
FOR SELECT 
USING (organization_id IN (SELECT get_user_organization_ids()));

-- Create trigger for updated_at
CREATE TRIGGER update_temperature_transition_rules_updated_at
BEFORE UPDATE ON public.temperature_transition_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();