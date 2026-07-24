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

  return { userId: user.id, role: sangpoUser.role, companyId: sangpoUser.company_id };
}

export async function GET() {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Certificate')
      .select('*, Sangpo_Supplier(name), Sangpo_Milestone(title)')
      .eq('company_id', authorization.companyId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ certificates: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load certificates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create certificates' }, { status: 403 });
    }

    const body = await request.json();
    const {
      supplier_id,
      milestone_id,
      certificate_number,
      certificate_date,
      invoice_number,
      invoice_amount,
      certified_amount,
      approval_status,
      approval_remark,
    } = body;

    if (!supplier_id || !certificate_number?.trim() || !certificate_date) {
      return NextResponse.json({ error: 'Supplier, certificate number, and date are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Certificate')
      .insert({
        company_id: authorization.companyId,
        supplier_id,
        milestone_id: milestone_id || null,
        certificate_number: certificate_number.trim(),
        certificate_date,
        invoice_number: invoice_number?.trim() || null,
        invoice_amount: Number(invoice_amount || 0),
        certified_amount: Number(certified_amount || 0),
        approval_status: approval_status || 'draft',
        approval_remark: approval_remark?.trim() || null,
        submitted_to_manager_at: approval_status === 'pending_approval' ? new Date().toISOString() : null,
        created_by: authorization.userId,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ certificate: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create certificate' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const body = await request.json();
    const { id, approval_status, approval_remark } = body;

    if (!id) {
      return NextResponse.json({ error: 'Certificate id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (approval_status) {
      updates.approval_status = approval_status;
      if (approval_status === 'pending_approval') {
        updates.submitted_to_manager_at = new Date().toISOString();
      }
      if (approval_status === 'approved') {
        updates.approved_by = authorization.userId;
        updates.approved_at = new Date().toISOString();
      }
    }

    if (typeof approval_remark === 'string') {
      updates.approval_remark = approval_remark.trim() || null;
    }

    if (authorization.role !== 'admin' && !(authorization.role === 'manager' && approval_status === 'approved')) {
      return NextResponse.json({ error: 'You are not allowed to update this certificate' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Certificate')
      .update(updates)
      .eq('id', id)
      .eq('company_id', authorization.companyId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ certificate: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update certificate' }, { status: 500 });
  }
}
