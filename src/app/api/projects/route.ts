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

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Project')
      .select('*')
      .eq('company_id', authorization.companyId)
      .order('created_at', { ascending: true })
      .order('name', { ascending: true });

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
      return NextResponse.json({
        projects: [inserted],
        defaultProjectId: inserted.id,
      });
    }

    return NextResponse.json({
      projects,
      defaultProjectId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create projects' }, { status: 403 });
    }

    const body = await request.json();
    const { name, overall_budget, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Project')
      .insert({
        company_id: authorization.companyId,
        name: name.trim(),
        overall_budget: Number(overall_budget || 0),
        notes: notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update projects' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, overall_budget, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('Sangpo_Project')
      .update({
        name: name?.trim() || undefined,
        overall_budget: overall_budget === undefined ? undefined : Number(overall_budget || 0),
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete projects' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project id is required' }, { status: 400 });
    }

    const { count, error: countError } = await supabaseAdmin
      .from('Sangpo_Supplier')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', authorization.companyId)
      .eq('project_id', id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 400 });
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a project that still has suppliers or records. Move them first.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('Sangpo_Project')
      .delete()
      .eq('id', id)
      .eq('company_id', authorization.companyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
