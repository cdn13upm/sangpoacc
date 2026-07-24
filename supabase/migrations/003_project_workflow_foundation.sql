-- Project-level budget and workflow foundation for Sangpo Temple Renovation

CREATE TABLE IF NOT EXISTS public."Sangpo_Project" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public."Sangpo_Company"(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Sangpo Temple Renovation Account',
  overall_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (company_id, name)
);

ALTER TABLE public."Sangpo_Project" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Supplier' AND column_name = 'contract_reference'
  ) THEN
    ALTER TABLE public."Sangpo_Supplier" ADD COLUMN contract_reference TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Supplier' AND column_name = 'contract_award_value'
  ) THEN
    ALTER TABLE public."Sangpo_Supplier" ADD COLUMN contract_award_value NUMERIC(12,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Supplier' AND column_name = 'contract_award_date'
  ) THEN
    ALTER TABLE public."Sangpo_Supplier" ADD COLUMN contract_award_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Supplier' AND column_name = 'scope_of_work'
  ) THEN
    ALTER TABLE public."Sangpo_Supplier" ADD COLUMN scope_of_work TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Supplier' AND column_name = 'remark'
  ) THEN
    ALTER TABLE public."Sangpo_Supplier" ADD COLUMN remark TEXT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public."Sangpo_Milestone" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public."Sangpo_Company"(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public."Sangpo_Supplier"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  milestone_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  approved_invoice_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  manual_paid_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."Sangpo_Milestone" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."Sangpo_Variation_Order" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public."Sangpo_Company"(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public."Sangpo_Supplier"(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public."Sangpo_Milestone"(id) ON DELETE SET NULL,
  vo_number TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."Sangpo_Variation_Order" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Certificate' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE public."Sangpo_Certificate" ADD COLUMN supplier_id UUID REFERENCES public."Sangpo_Supplier"(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Certificate' AND column_name = 'milestone_id'
  ) THEN
    ALTER TABLE public."Sangpo_Certificate" ADD COLUMN milestone_id UUID REFERENCES public."Sangpo_Milestone"(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Certificate' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE public."Sangpo_Certificate" ADD COLUMN invoice_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Certificate' AND column_name = 'invoice_amount'
  ) THEN
    ALTER TABLE public."Sangpo_Certificate" ADD COLUMN invoice_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Certificate' AND column_name = 'certified_amount'
  ) THEN
    ALTER TABLE public."Sangpo_Certificate" ADD COLUMN certified_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Certificate' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE public."Sangpo_Certificate" ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'draft';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Certificate' AND column_name = 'submitted_to_manager_at'
  ) THEN
    ALTER TABLE public."Sangpo_Certificate" ADD COLUMN submitted_to_manager_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Sangpo_Certificate' AND column_name = 'approval_remark'
  ) THEN
    ALTER TABLE public."Sangpo_Certificate" ADD COLUMN approval_remark TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Sangpo_Project' AND policyname = 'Users can view their company projects'
  ) THEN
    CREATE POLICY "Users can view their company projects" ON public."Sangpo_Project"
      FOR SELECT USING (auth.uid() IN (SELECT id FROM public."Sangpo_User" WHERE company_id = "Sangpo_Project".company_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Sangpo_Project' AND policyname = 'Admins can manage projects'
  ) THEN
    CREATE POLICY "Admins can manage projects" ON public."Sangpo_Project"
      FOR ALL USING (auth.uid() IN (SELECT id FROM public."Sangpo_User" WHERE role = 'admin'))
      WITH CHECK (auth.uid() IN (SELECT id FROM public."Sangpo_User" WHERE role = 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Sangpo_Milestone' AND policyname = 'Users can view their company milestones'
  ) THEN
    CREATE POLICY "Users can view their company milestones" ON public."Sangpo_Milestone"
      FOR SELECT USING (auth.uid() IN (SELECT id FROM public."Sangpo_User" WHERE company_id = "Sangpo_Milestone".company_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Sangpo_Milestone' AND policyname = 'Admins can manage milestones'
  ) THEN
    CREATE POLICY "Admins can manage milestones" ON public."Sangpo_Milestone"
      FOR ALL USING (auth.uid() IN (SELECT id FROM public."Sangpo_User" WHERE role = 'admin'))
      WITH CHECK (auth.uid() IN (SELECT id FROM public."Sangpo_User" WHERE role = 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Sangpo_Variation_Order' AND policyname = 'Users can view their company variation orders'
  ) THEN
    CREATE POLICY "Users can view their company variation orders" ON public."Sangpo_Variation_Order"
      FOR SELECT USING (auth.uid() IN (SELECT id FROM public."Sangpo_User" WHERE company_id = "Sangpo_Variation_Order".company_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Sangpo_Variation_Order' AND policyname = 'Admins can manage variation orders'
  ) THEN
    CREATE POLICY "Admins can manage variation orders" ON public."Sangpo_Variation_Order"
      FOR ALL USING (auth.uid() IN (SELECT id FROM public."Sangpo_User" WHERE role = 'admin'))
      WITH CHECK (auth.uid() IN (SELECT id FROM public."Sangpo_User" WHERE role = 'admin'));
  END IF;
END $$;
