-- Add non-contracted quotes columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS total_non_contracted_quote_items integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_non_contracted_quote_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS top_non_contracted_procedures text,
ADD COLUMN IF NOT EXISTS top_non_contracted_specialties text,
ADD COLUMN IF NOT EXISTS non_contracted_quotes_history jsonb DEFAULT '[]'::jsonb;

-- Add non-contracted quotes columns to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS total_non_contracted_quote_items integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_non_contracted_quote_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS top_non_contracted_procedures text,
ADD COLUMN IF NOT EXISTS top_non_contracted_specialties text,
ADD COLUMN IF NOT EXISTS non_contracted_quotes_history jsonb DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.leads.total_non_contracted_quote_items IS 'Total number of non-contracted quote items';
COMMENT ON COLUMN public.leads.total_non_contracted_quote_value IS 'Sum of all non-contracted quote values';
COMMENT ON COLUMN public.leads.top_non_contracted_procedures IS 'Most common non-contracted procedures';
COMMENT ON COLUMN public.leads.top_non_contracted_specialties IS 'Most common non-contracted specialties';
COMMENT ON COLUMN public.leads.non_contracted_quotes_history IS 'Detailed history of non-contracted quotes';

COMMENT ON COLUMN public.patients.total_non_contracted_quote_items IS 'Total number of non-contracted quote items';
COMMENT ON COLUMN public.patients.total_non_contracted_quote_value IS 'Sum of all non-contracted quote values';
COMMENT ON COLUMN public.patients.top_non_contracted_procedures IS 'Most common non-contracted procedures';
COMMENT ON COLUMN public.patients.top_non_contracted_specialties IS 'Most common non-contracted specialties';
COMMENT ON COLUMN public.patients.non_contracted_quotes_history IS 'Detailed history of non-contracted quotes';