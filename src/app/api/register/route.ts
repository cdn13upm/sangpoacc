import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service_role key to bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  console.log('Register API called');
  try {
    const { email, password, companyName, role } = await request.json();
    console.log('Request data:', { email, companyName, role });

    // 1. Create company
    console.log('Creating company...');
    const { data: company, error: companyError } = await supabaseAdmin
      .from('Sangpo_Company')
      .insert({ name: companyName })
      .select('id')
      .single();

    console.log('Company creation result:', { company, companyError });
    if (companyError) throw new Error('Failed to create company: ' + companyError.message);

    // 2. Create user in Supabase Auth
    console.log('Creating auth user...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email
    });

    console.log('Auth user creation result:', { authUser, authError });
    if (authError) throw new Error(authError.message);

    // 3. Link user to company in Sangpo_User
    console.log('Linking user to company...');
    const { error: userError } = await supabaseAdmin
      .from('Sangpo_User')
      .insert({
        id: authUser.user?.id,
        company_id: company.id,
        role
      });

    console.log('User linking result:', { userError });
    if (userError) throw new Error('Failed to link user to company: ' + userError.message);

    console.log('Registration successful');
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
