import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import {
  getActiveProjectIdFromRequest,
  resolveActiveProjectId,
} from '@/lib/projects';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getAuthorizedUser(request?: Request, requireAdmin = false) {
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

  if (requireAdmin && sangpoUser.role !== 'admin') {
    return { error: 'Only admins can manage suppliers', status: 403 as const };
  }

  if (!sangpoUser.company_id) {
    return { error: 'No company assigned to this user', status: 400 as const };
  }

  const overrideProjectId = request ? getActiveProjectIdFromRequest(request) : null;
  const projectId = await resolveActiveProjectId(
    supabaseAdmin,
    sangpoUser.company_id,
    overrideProjectId
  );

  return {
    role: sangpoUser.role,
    companyId: sangpoUser.company_id,
    projectId,
  };
}

export async function GET(request: Request) {
  try {
    const authorization = await getAuthorizedUser(request);
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    let query = supabaseAdmin
      .from('Sangpo_Supplier')
      .select('*')
      .eq('company_id', authorization.companyId);

    if (authorization.projectId) {
      query = query.eq('project_id', authorization.projectId);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ suppliers: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await getAuthorizedUser(request, true);
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      tax_id,
      contract_reference,
      contract_award_value,
      contract_award_date,
      scope_of_work,
      remark,
      project_id,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    const resolvedProjectId = project_id || authorization.projectId;

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Supplier')
      .insert({
        company_id: authorization.companyId,
        project_id: resolvedProjectId || null,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        tax_id: tax_id?.trim() || null,
        contract_reference: contract_reference?.trim() || null,
        contract_award_value: Number(contract_award_value || 0),
        contract_award_date: contract_award_date || null,
        scope_of_work: scope_of_work?.trim() || null,
        remark: remark?.trim() || null,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ supplier: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add supplier' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authorization = await getAuthorizedUser(request, true);
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const body = await request.json();
    const {
      id,
      name,
      email,
      phone,
      address,
      tax_id,
      contract_reference,
      contract_award_value,
      contract_award_date,
      scope_of_work,
      remark,
      project_id,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Supplier id is required' }, { status: 400 });
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      tax_id: tax_id?.trim() || null,
      contract_reference: contract_reference?.trim() || null,
      contract_award_value: Number(contract_award_value || 0),
      contract_award_date: contract_award_date || null,
      scope_of_work: scope_of_work?.trim() || null,
      remark: remark?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (project_id !== undefined) {
      updates.project_id = project_id || null;
    }

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Supplier')
      .update(updates)
      .eq('id', id)
      .eq('company_id', authorization.companyId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ supplier: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = await getAuthorizedUser(request, true);
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Supplier id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('Sangpo_Supplier')
      .delete()
      .eq('id', id)
      .eq('company_id', authorization.companyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete supplier' }, { status: 500 });
  }
}
