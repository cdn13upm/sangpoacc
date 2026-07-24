import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service_role key to bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  console.log('=== Register API called ===');
  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { email, password, companyName, role } = body;

    // Validate input
    if (!email || !password || !companyName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create company
    console.log('Step 1: Creating company...');
    const { data: company, error: companyError } = await supabaseAdmin
      .from('Sangpo_Company')
      .insert({ name: companyName })
      .select('id')
      .single();

    if (companyError) {
      console.error('Company creation error:', companyError);
      throw new Error('Failed to create company: ' + companyError.message);
    }
    console.log('Company created:', company);

    // 2. Create user in Supabase Auth
    console.log('Step 2: Creating auth user...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      throw new Error(authError.message);
    }
    console.log('Auth user created:', authUser);

    if (!authUser.user) {
      throw new Error('No user returned from Supabase Auth');
    }

    // 3. Link user to company in Sangpo_User
    console.log('Step 3: Linking user to company...');
    const { error: userError } = await supabaseAdmin
      .from('Sangpo_User')
      .insert({
        id: authUser.user.id,
        company_id: company.id,
        role
      });

    if (userError) {
      console.error('User linking error:', userError);
      throw new Error('Failed to link user to company: ' + userError.message);
    }
    console.log('User linked successfully');

    console.log('=== Registration successful ===');
    return NextResponse.json({ success: true, userId: authUser.user.id }, { status: 201 });
  } catch (error: any) {
    console.error('=== Registration API error ===', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
