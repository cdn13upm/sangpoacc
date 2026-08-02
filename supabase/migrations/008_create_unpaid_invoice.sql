CREATE TABLE IF NOT EXISTS public."Sangpo_Unpaid_Invoice" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  invoice_number text NOT NULL,
  invoice_date date,
  due_date date,
  invoice_amount numeric(18,2) NOT NULL DEFAULT 0,
  description text,
  remark text,
  status text NOT NULL DEFAULT 'pending_approval',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public."Sangpo_Unpaid_Invoice" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS unpaid_invoice_company_idx ON public."Sangpo_Unpaid_Invoice"(company_id);
CREATE INDEX IF NOT EXISTS unpaid_invoice_supplier_idx ON public."Sangpo_Unpaid_Invoice"(supplier_id);
CREATE INDEX IF NOT EXISTS unpaid_invoice_status_idx ON public."Sangpo_Unpaid_Invoice"(status);
CREATE INDEX IF NOT EXISTS unpaid_invoice_invoice_number_idx ON public."Sangpo_Unpaid_Invoice"(invoice_number);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Sangpo_Company'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unpaid_invoice_company_fk'
  ) THEN
    ALTER TABLE public."Sangpo_Unpaid_Invoice"
      ADD CONSTRAINT unpaid_invoice_company_fk
      FOREIGN KEY (company_id) REFERENCES public."Sangpo_Company"(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Sangpo_Supplier'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unpaid_invoice_supplier_fk'
  ) THEN
    ALTER TABLE public."Sangpo_Unpaid_Invoice"
      ADD CONSTRAINT unpaid_invoice_supplier_fk
      FOREIGN KEY (supplier_id) REFERENCES public."Sangpo_Supplier"(id)
      ON DELETE CASCADE;
  END IF;
END $$;
