import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service_role key to bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { email, password, companyName, role } = await request.json();

    // 1. Create company
    const { data: company, error: companyError } = await supabaseAdmin
      .from('Sangpo_Company')
      .insert({ name: companyName })
      .select('id')
      .single();

    if (companyError) throw new Error('Failed to create company');

    // 2. Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email
    });

    if (authError) throw new Error(authError.message);

    // 3. Link user to company in Sangpo_User
    const { error: userError } = await supabaseAdmin
      .from('Sangpo_User')
      .insert({
        id: authUser.user?.id,
        company_id: company.id,
        role
      });

    if (userError) throw new Error('Failed to link user to company');

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
