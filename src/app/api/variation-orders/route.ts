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
      .from('Sangpo_Variation_Order')
      .select('*, Sangpo_Supplier(name)')
      .eq('company_id', authorization.companyId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ variationOrders: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load variation orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create variation orders' }, { status: 403 });
    }

    const body = await request.json();
    const { supplier_id, milestone_id, vo_number, description, amount, status, payment_date, payment_reference } = body;

    if (!supplier_id || !vo_number?.trim()) {
      return NextResponse.json({ error: 'Supplier and VO number are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Variation_Order')
      .insert({
        company_id: authorization.companyId,
        supplier_id,
        milestone_id: milestone_id || null,
        vo_number: vo_number.trim(),
        description: description?.trim() || null,
        amount: Number(amount || 0),
        status: status || 'draft',
        payment_date: payment_date || null,
        payment_reference: payment_reference?.trim() || null,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ variationOrder: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create variation order' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update variation orders' }, { status: 403 });
    }

    const body = await request.json();
    const { id, supplier_id, milestone_id, vo_number, description, amount, status, payment_date, payment_reference } = body;

    if (!id || !supplier_id || !vo_number?.trim()) {
      return NextResponse.json({ error: 'VO id, supplier, and VO number are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Variation_Order')
      .update({
        supplier_id,
        milestone_id: milestone_id || null,
        vo_number: vo_number.trim(),
        description: description?.trim() || null,
        amount: Number(amount || 0),
        status: status || 'draft',
        payment_date: payment_date || null,
        payment_reference: payment_reference?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('company_id', authorization.companyId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ variationOrder: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update variation order' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete variation orders' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Variation order id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('Sangpo_Variation_Order')
      .delete()
      .eq('id', id)
      .eq('company_id', authorization.companyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete variation order' }, { status: 500 });
  }
}
