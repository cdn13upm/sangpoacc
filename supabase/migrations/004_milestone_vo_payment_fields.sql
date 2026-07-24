ALTER TABLE public."Sangpo_Milestone"
  ADD COLUMN IF NOT EXISTS payment_date DATE,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

ALTER TABLE public."Sangpo_Variation_Order"
  ADD COLUMN IF NOT EXISTS payment_date DATE,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

ALTER TABLE public."Sangpo_Milestone"
  DROP COLUMN IF EXISTS manual_paid_total;
