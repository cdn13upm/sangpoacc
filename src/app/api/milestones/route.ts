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
      .from('Sangpo_Milestone')
      .select('*, Sangpo_Supplier(name, contract_award_value)')
      .eq('company_id', authorization.companyId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ milestones: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load milestones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create milestones' }, { status: 403 });
    }

    const body = await request.json();
    const {
      supplier_id,
      title,
      description,
      milestone_amount,
      approved_invoice_total,
      payment_date,
      payment_reference,
      sort_order,
      status,
    } = body;

    if (!supplier_id || !title?.trim()) {
      return NextResponse.json({ error: 'Supplier and milestone title are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Milestone')
      .insert({
        company_id: authorization.companyId,
        supplier_id,
        title: title.trim(),
        description: description?.trim() || null,
        milestone_amount: Number(milestone_amount || 0),
        approved_invoice_total: Number(approved_invoice_total || 0),
        payment_date: payment_date || null,
        payment_reference: payment_reference?.trim() || null,
        sort_order: Number(sort_order || 0),
        status: status || 'draft',
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ milestone: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create milestone' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update milestones' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      supplier_id,
      title,
      description,
      milestone_amount,
      approved_invoice_total,
      payment_date,
      payment_reference,
      sort_order,
      status,
    } = body;

    if (!id || !supplier_id || !title?.trim()) {
      return NextResponse.json({ error: 'Milestone id, supplier, and title are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Milestone')
      .update({
        supplier_id,
        title: title.trim(),
        description: description?.trim() || null,
        milestone_amount: Number(milestone_amount || 0),
        approved_invoice_total: Number(approved_invoice_total || 0),
        payment_date: payment_date || null,
        payment_reference: payment_reference?.trim() || null,
        sort_order: Number(sort_order || 0),
        status: status || 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('company_id', authorization.companyId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ milestone: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update milestone' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete milestones' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Milestone id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('Sangpo_Milestone')
      .delete()
      .eq('id', id)
      .eq('company_id', authorization.companyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete milestone' }, { status: 500 });
  }
}
