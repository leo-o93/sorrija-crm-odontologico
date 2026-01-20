-- Add financial metrics columns to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS total_appointments integer DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS total_quotes integer DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS total_sales integer DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS total_revenue numeric DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_sale_date date;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_sale_amount numeric;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_sale_payment_method text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contracted_value numeric DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS non_contracted_value numeric DEFAULT 0;

-- Add financial metrics columns to patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS total_appointments integer DEFAULT 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS total_attendances integer DEFAULT 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS total_quotes integer DEFAULT 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS total_sales integer DEFAULT 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS total_revenue numeric DEFAULT 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS last_sale_date date;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS last_sale_amount numeric;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS last_sale_payment_method text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS contracted_value numeric DEFAULT 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS non_contracted_value numeric DEFAULT 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS contract_date date;