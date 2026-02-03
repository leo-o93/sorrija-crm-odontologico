ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_type TEXT;

ALTER TABLE public.quotes
  DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_status_check
  CHECK (status IN (
    'draft',
    'sent',
    'approved',
    'rejected',
    'expired',
    'converted',
    'not_closed',
    'partially_closed',
    'closed'
  ));

ALTER TABLE public.quotes
  DROP CONSTRAINT IF EXISTS quotes_payment_type_check;

ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_payment_type_check
  CHECK (payment_type IS NULL OR payment_type IN ('particular', 'convenio'));

ALTER TABLE public.quote_items
  ADD COLUMN IF NOT EXISTS tooth TEXT,
  ADD COLUMN IF NOT EXISTS specialty TEXT,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC NOT NULL DEFAULT 0;

UPDATE public.quote_items
SET subtotal = total_price
WHERE subtotal = 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_active_patient
ON public.quotes(patient_id)
WHERE patient_id IS NOT NULL
  AND status IN ('draft', 'sent', 'approved', 'partially_closed');

CREATE OR REPLACE FUNCTION public.ensure_quote_payment_before_close()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('partially_closed', 'closed') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.quote_payments
      WHERE quote_id = NEW.id
        AND amount > 0
    ) THEN
      RAISE EXCEPTION 'Pagamento obrigatório para fechar orçamento';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_quote_payment_before_close ON public.quotes;
CREATE TRIGGER ensure_quote_payment_before_close
BEFORE INSERT OR UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.ensure_quote_payment_before_close();
