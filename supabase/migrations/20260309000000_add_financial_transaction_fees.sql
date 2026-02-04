ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS fee_percent NUMERIC,
ADD COLUMN IF NOT EXISTS fee_value NUMERIC,
ADD COLUMN IF NOT EXISTS discount_value NUMERIC,
ADD COLUMN IF NOT EXISTS net_value NUMERIC;

UPDATE public.financial_transactions
SET fee_percent = COALESCE(fee_percent, 0),
    fee_value = COALESCE(fee_value, 0),
    discount_value = COALESCE(discount_value, 0),
    net_value = COALESCE(net_value, amount - COALESCE(fee_value, 0) - COALESCE(discount_value, 0));
