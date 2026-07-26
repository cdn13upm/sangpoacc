import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isSangpoRole } from '@/lib/roles';

// Create a Supabase client with service_role key to bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  console.log('=== Register API called ===');
  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { email, password, companyName, role, username, existingCompanyId, companyMode } = body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedUsername = normalizeUsername(username || '');

    // Validate input
    if (!normalizedEmail || !password || !role || !normalizedUsername) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!/^[a-z0-9._-]{3,30}$/.test(normalizedUsername)) {
      return NextResponse.json(
        { error: 'Username must be 3-30 characters and use only letters, numbers, dot, underscore, or hyphen' },
        { status: 400 }
      );
    }

    if (!isSangpoRole(role)) {
      return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 });
    }

    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from('Sangpo_User')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (existingUserError) {
      throw new Error(existingUserError.message);
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    let companyId = '';

    if (companyMode === 'existing') {
      if (!existingCompanyId) {
        return NextResponse.json({ error: 'Please select an existing company' }, { status: 400 });
      }

      const { data: company, error: companyError } = await supabaseAdmin
        .from('Sangpo_Company')
        .select('id')
        .eq('id', existingCompanyId)
        .single();

      if (companyError || !company) {
        throw new Error(companyError?.message || 'Selected company not found');
      }

      companyId = company.id;
    } else {
      if (!companyName?.trim()) {
        return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
      }

      console.log('Step 1: Creating company...');
      const { data: company, error: companyError } = await supabaseAdmin
        .from('Sangpo_Company')
        .insert({ name: companyName.trim() })
        .select('id')
        .single();

      if (companyError) {
        console.error('Company creation error:', companyError);
        throw new Error('Failed to create company: ' + companyError.message);
      }
      console.log('Company created:', company);
      companyId = company.id;
    }

    // 2. Create user in Supabase Auth
    console.log('Step 2: Creating auth user...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username: normalizedUsername,
      },
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
        company_id: companyId,
        role,
        email: normalizedEmail,
        username: normalizedUsername,
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
