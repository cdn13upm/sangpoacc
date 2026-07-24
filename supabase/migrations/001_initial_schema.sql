-- Create Sangpo Company Table
CREATE TABLE IF NOT EXISTS public.Sangpo_Company (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sangpo Supplier Table
CREATE TABLE IF NOT EXISTS public.Sangpo_Supplier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.Sangpo_Company(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    tax_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sangpo User Role Enum
CREATE TYPE public.Sangpo_User_Role AS ENUM ('admin', 'manager');

-- Create Sangpo User Table
CREATE TABLE IF NOT EXISTS public.Sangpo_User (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.Sangpo_Company(id) ON DELETE SET NULL,
    role public.Sangpo_User_Role NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sangpo Document Type Enum
CREATE TYPE public.Sangpo_Document_Type AS ENUM ('invoice', 'quotation', 'vo', 'other');

-- Create Sangpo Document Table
CREATE TABLE IF NOT EXISTS public.Sangpo_Document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.Sangpo_Company(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.Sangpo_Supplier(id) ON DELETE SET NULL,
    type public.Sangpo_Document_Type NOT NULL,
    document_number TEXT NOT NULL,
    document_date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    file_url TEXT,
    status TEXT DEFAULT 'pending',
    created_by UUID REFERENCES public.Sangpo_User(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sangpo Payment Status Enum
CREATE TYPE public.Sangpo_Payment_Status AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- Create Sangpo Payment Table
CREATE TABLE IF NOT EXISTS public.Sangpo_Payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.Sangpo_Company(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.Sangpo_Supplier(id) ON DELETE SET NULL,
    document_ids UUID[],
    amount NUMERIC(10,2) NOT NULL,
    payment_date DATE,
    status public.Sangpo_Payment_Status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES public.Sangpo_User(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.Sangpo_User(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sangpo Certificate Table
CREATE TABLE IF NOT EXISTS public.Sangpo_Certificate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.Sangpo_Company(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.Sangpo_Payment(id) ON DELETE CASCADE,
    certificate_number TEXT NOT NULL,
    certificate_date DATE NOT NULL,
    file_url TEXT,
    created_by UUID REFERENCES public.Sangpo_User(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.Sangpo_Company ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Sangpo_Supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Sangpo_User ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Sangpo_Document ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Sangpo_Payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Sangpo_Certificate ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (basic, can be refined later)
-- Allow authenticated users to read their company's data
CREATE POLICY "Users can view their company data" ON public.Sangpo_Company
    FOR SELECT USING (auth.uid() IN (SELECT id FROM public.Sangpo_User WHERE company_id = Sangpo_Company.id));

CREATE POLICY "Users can view their company's suppliers" ON public.Sangpo_Supplier
    FOR SELECT USING (auth.uid() IN (SELECT id FROM public.Sangpo_User WHERE company_id = Sangpo_Supplier.company_id));

CREATE POLICY "Users can view their user data" ON public.Sangpo_User
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view their company's documents" ON public.Sangpo_Document
    FOR SELECT USING (auth.uid() IN (SELECT id FROM public.Sangpo_User WHERE company_id = Sangpo_Document.company_id));

CREATE POLICY "Users can view their company's payments" ON public.Sangpo_Payment
    FOR SELECT USING (auth.uid() IN (SELECT id FROM public.Sangpo_User WHERE company_id = Sangpo_Payment.company_id));

CREATE POLICY "Users can view their company's certificates" ON public.Sangpo_Certificate
    FOR SELECT USING (auth.uid() IN (SELECT id FROM public.Sangpo_User WHERE company_id = Sangpo_Certificate.company_id));

-- Allow admins to insert/update/delete
CREATE POLICY "Admins can manage companies" ON public.Sangpo_Company
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.Sangpo_User WHERE role = 'admin'));

CREATE POLICY "Admins can manage suppliers" ON public.Sangpo_Supplier
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.Sangpo_User WHERE role = 'admin'));

CREATE POLICY "Admins can manage documents" ON public.Sangpo_Document
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.Sangpo_User WHERE role = 'admin'));

CREATE POLICY "Admins can manage payments" ON public.Sangpo_Payment
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.Sangpo_User WHERE role = 'admin'));

CREATE POLICY "Admins can manage certificates" ON public.Sangpo_Certificate
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.Sangpo_User WHERE role = 'admin'));

-- Allow managers to approve payments
CREATE POLICY "Managers can approve payments" ON public.Sangpo_Payment
    FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.Sangpo_User WHERE role = 'manager'));
