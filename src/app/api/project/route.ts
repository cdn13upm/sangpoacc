import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
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

function pickDefaultProject(rows: Array<{ id: string; created_at: string | null }> | null) {
  if (!rows || rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (aTime !== bTime) return aTime - bTime;
    return a.id.localeCompare(b.id);
  });
  return sorted[0].id;
}

export async function GET() {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const cookieStore = cookies();
    const headerStore = headers();
    const preferredProjectId =
      cookieStore.get('sangpo_project_id')?.value ||
      headerStore.get('x-sangpo-project-id') ||
      null;

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Project')
      .select('*')
      .eq('company_id', authorization.companyId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const projects = data || [];
    let defaultProjectId = pickDefaultProject(projects);

    if (!defaultProjectId) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('Sangpo_Project')
        .insert({
          company_id: authorization.companyId,
          name: 'Sangpo Temple Renovation Account',
          overall_budget: 0,
          notes: null,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }
      return NextResponse.json({ project: inserted });
    }

    const activeProject =
      (preferredProjectId && projects.find((p: any) => p.id === preferredProjectId)) ||
      projects.find((p: any) => p.id === defaultProjectId) ||
      projects[0] ||
      null;

    return NextResponse.json({ project: activeProject });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update project settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, overall_budget, notes } = body;

    if (id) {
      const { error } = await supabaseAdmin
        .from('Sangpo_Project')
        .update({
          name: name?.trim() || undefined,
          overall_budget:
            overall_budget === undefined ? undefined : Number(overall_budget || 0),
          notes: notes === undefined ? undefined : notes?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('company_id', authorization.companyId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const { data: updated } = await supabaseAdmin
        .from('Sangpo_Project')
        .select('*')
        .eq('id', id)
        .single();

      return NextResponse.json({ project: updated });
    }

    const { data: existingProject } = await supabaseAdmin
      .from('Sangpo_Project')
      .select('id')
      .eq('company_id', authorization.companyId)
      .order('created_at', { ascending: true })
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
    return NextResponse.json(
      { error: error.message || 'Failed to save project settings' },
      { status: 500 }
    );
  }
}
