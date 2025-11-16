-- Create webhooks table to store all incoming webhook requests
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Request information
  method text NOT NULL DEFAULT 'POST',
  path text,
  origin text,
  
  -- Headers received (JSON)
  headers jsonb,
  
  -- Query params (if any)
  query_params jsonb,
  
  -- Complete request body (JSON)
  payload jsonb NOT NULL,
  
  -- Metadata
  ip_address text,
  user_agent text,
  
  -- Processing status (for future use)
  status text DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed')),
  processed_at timestamptz,
  error_message text,
  
  -- Search index
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese', COALESCE(payload::text, ''))
  ) STORED
);

-- Indexes for performance
CREATE INDEX idx_webhooks_created_at ON public.webhooks(created_at DESC);
CREATE INDEX idx_webhooks_status ON public.webhooks(status);
CREATE INDEX idx_webhooks_method ON public.webhooks(method);
CREATE INDEX idx_webhooks_search ON public.webhooks USING gin(search_vector);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage webhooks
CREATE POLICY "Admins can view all webhooks"
  ON public.webhooks
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete webhooks"
  ON public.webhooks
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update webhooks"
  ON public.webhooks
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Optional: Function to cleanup old webhooks (after 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_webhooks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.webhooks
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;