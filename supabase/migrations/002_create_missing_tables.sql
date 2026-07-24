-- Create Sangpo_Company if it doesn't exist
CREATE TABLE IF NOT EXISTS public."Sangpo_Company" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sangpo_Supplier if it doesn't exist
CREATE TABLE IF NOT EXISTS public."Sangpo_Supplier" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public."Sangpo_Company"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sangpo_Document if it doesn't exist
CREATE TABLE IF NOT EXISTS public."Sangpo_Document" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public."Sangpo_Company"(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public."Sangpo_Supplier"(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  document_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sangpo_Payment if it doesn't exist
CREATE TABLE IF NOT EXISTS public."Sangpo_Payment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public."Sangpo_Company"(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public."Sangpo_Supplier"(id) ON DELETE SET NULL,
  document_ids UUID[],
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sangpo_Certificate if it doesn't exist
CREATE TABLE IF NOT EXISTS public."Sangpo_Certificate" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public."Sangpo_Company"(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public."Sangpo_Payment"(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL,
  certificate_date DATE NOT NULL,
  file_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now, create Sangpo_User, which was the missing table!
CREATE TABLE IF NOT EXISTS public."Sangpo_User" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public."Sangpo_Company"(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
