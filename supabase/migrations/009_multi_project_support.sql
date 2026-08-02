DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Sangpo_Supplier'
      AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public."Sangpo_Supplier" ADD COLUMN project_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Sangpo_Milestone'
      AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public."Sangpo_Milestone" ADD COLUMN project_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Sangpo_Variation_Order'
      AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public."Sangpo_Variation_Order" ADD COLUMN project_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Sangpo_Certificate'
      AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public."Sangpo_Certificate" ADD COLUMN project_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Sangpo_Unpaid_Invoice'
      AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public."Sangpo_Unpaid_Invoice" ADD COLUMN project_id UUID;
  END IF;
END $$;

DO $$
DECLARE
  company_row RECORD;
  default_project_id UUID;
BEGIN
  FOR company_row IN
    SELECT id FROM public."Sangpo_Company"
  LOOP
    SELECT id INTO default_project_id
    FROM public."Sangpo_Project"
    WHERE company_id = company_row.id
    ORDER BY created_at ASC, id ASC
    LIMIT 1;

    IF default_project_id IS NULL THEN
      INSERT INTO public."Sangpo_Project" (company_id, name, overall_budget, notes, created_at, updated_at)
      VALUES (
        company_row.id,
        'Sangpo Temple Renovation Account',
        COALESCE(0, 0),
        NULL,
        NOW(),
        NOW()
      )
      RETURNING id INTO default_project_id;
    END IF;

    UPDATE public."Sangpo_Supplier"
    SET project_id = default_project_id
    WHERE company_id = company_row.id
      AND project_id IS NULL;

    UPDATE public."Sangpo_Milestone"
    SET project_id = default_project_id
    WHERE company_id = company_row.id
      AND project_id IS NULL;

    UPDATE public."Sangpo_Variation_Order"
    SET project_id = default_project_id
    WHERE company_id = company_row.id
      AND project_id IS NULL;

    UPDATE public."Sangpo_Certificate"
    SET project_id = default_project_id
    WHERE company_id = company_row.id
      AND project_id IS NULL;

    UPDATE public."Sangpo_Unpaid_Invoice"
    SET project_id = default_project_id
    WHERE company_id = company_row.id
      AND project_id IS NULL;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS sangpo_supplier_project_idx ON public."Sangpo_Supplier"(project_id);
CREATE INDEX IF NOT EXISTS sangpo_milestone_project_idx ON public."Sangpo_Milestone"(project_id);
CREATE INDEX IF NOT EXISTS sangpo_vo_project_idx ON public."Sangpo_Variation_Order"(project_id);
CREATE INDEX IF NOT EXISTS sangpo_certificate_project_idx ON public."Sangpo_Certificate"(project_id);
CREATE INDEX IF NOT EXISTS sangpo_unpaid_invoice_project_idx ON public."Sangpo_Unpaid_Invoice"(project_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Sangpo_Project'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sangpo_supplier_project_fk'
  ) THEN
    ALTER TABLE public."Sangpo_Supplier"
      ADD CONSTRAINT sangpo_supplier_project_fk
      FOREIGN KEY (project_id) REFERENCES public."Sangpo_Project"(id)
      ON DELETE SET NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Sangpo_Project'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sangpo_milestone_project_fk'
  ) THEN
    ALTER TABLE public."Sangpo_Milestone"
      ADD CONSTRAINT sangpo_milestone_project_fk
      FOREIGN KEY (project_id) REFERENCES public."Sangpo_Project"(id)
      ON DELETE SET NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Sangpo_Project'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sangpo_vo_project_fk'
  ) THEN
    ALTER TABLE public."Sangpo_Variation_Order"
      ADD CONSTRAINT sangpo_vo_project_fk
      FOREIGN KEY (project_id) REFERENCES public."Sangpo_Project"(id)
      ON DELETE SET NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Sangpo_Project'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sangpo_certificate_project_fk'
  ) THEN
    ALTER TABLE public."Sangpo_Certificate"
      ADD CONSTRAINT sangpo_certificate_project_fk
      FOREIGN KEY (project_id) REFERENCES public."Sangpo_Project"(id)
      ON DELETE SET NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Sangpo_Project'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sangpo_unpaid_invoice_project_fk'
  ) THEN
    ALTER TABLE public."Sangpo_Unpaid_Invoice"
      ADD CONSTRAINT sangpo_unpaid_invoice_project_fk
      FOREIGN KEY (project_id) REFERENCES public."Sangpo_Project"(id)
      ON DELETE SET NULL;
  END IF;
END $$;
