import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getAuthorizedUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', status: 401 as const };
  }

  const { data: sangpoUser, error } = await supabase
    .from('Sangpo_User')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (error || !sangpoUser) {
    return { error: 'User profile not found', status: 404 as const };
  }

  if (!sangpoUser.company_id) {
    return { error: 'No company assigned to this user', status: 400 as const };
  }

  return { role: sangpoUser.role, companyId: sangpoUser.company_id };
}

export async function GET() {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Project')
      .select('*')
      .eq('company_id', authorization.companyId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ project: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load project' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update project settings' }, { status: 403 });
    }

    const body = await request.json();
    const { name, overall_budget, notes } = body;

    const { data: existingProject } = await supabaseAdmin
      .from('Sangpo_Project')
      .select('id')
      .eq('company_id', authorization.companyId)
      .limit(1)
      .maybeSingle();

    const payload = {
      company_id: authorization.companyId,
      name: name?.trim() || 'Sangpo Temple Renovation Account',
      overall_budget: Number(overall_budget || 0),
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const query = existingProject
      ? supabaseAdmin.from('Sangpo_Project').update(payload).eq('id', existingProject.id)
      : supabaseAdmin.from('Sangpo_Project').insert(payload);

    const { data, error } = await query.select('*').single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ project: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save project settings' }, { status: 500 });
  }
}
