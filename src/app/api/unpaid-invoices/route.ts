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

const approveRoles = ['admin', 'manager', 'company_director'];

async function getAuthorizedUser(request?: Request) {
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
      .from('Sangpo_Unpaid_Invoice')
      .select('*, Sangpo_Supplier(name)')
      .eq('company_id', authorization.companyId);

    if (authorization.projectId) {
      query = query.eq('project_id', authorization.projectId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ unpaidInvoices: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load unpaid invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await getAuthorizedUser(request);
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create unpaid invoices' }, { status: 403 });
    }

    const body = await request.json();
    const {
      supplier_id,
      invoice_number,
      invoice_date,
      due_date,
      invoice_amount,
      description,
      remark,
      status,
      project_id,
    } = body;

    if (!supplier_id || !invoice_number?.trim()) {
      return NextResponse.json(
        { error: 'Supplier and invoice number are required' },
        { status: 400 }
      );
    }

    const resolvedProjectId = project_id || authorization.projectId;

    const { data: supplierRow, error: supplierError } = await supabaseAdmin
      .from('Sangpo_Supplier')
      .select('id, project_id')
      .eq('id', supplier_id)
      .eq('company_id', authorization.companyId)
      .maybeSingle();

    const finalProjectId = supplierError ? resolvedProjectId : supplierRow?.project_id || resolvedProjectId;

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Unpaid_Invoice')
      .insert({
        company_id: authorization.companyId,
        project_id: finalProjectId || null,
        supplier_id,
        invoice_number: invoice_number.trim(),
        invoice_date: invoice_date || null,
        due_date: due_date || null,
        invoice_amount: Number(invoice_amount || 0),
        description: description?.trim() || null,
        remark: remark?.trim() || null,
        status: status || 'pending_approval',
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ unpaidInvoice: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create unpaid invoice' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authorization = await getAuthorizedUser(request);
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const isAdmin = authorization.role === 'admin';
    const canApprove = !!authorization.role && approveRoles.includes(authorization.role);

    if (!isAdmin && !canApprove) {
      return NextResponse.json(
        { error: 'You do not have permission to update unpaid invoices' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      id,
      supplier_id,
      invoice_number,
      invoice_date,
      due_date,
      invoice_amount,
      description,
      remark,
      status,
      project_id,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Unpaid invoice id is required' }, { status: 400 });
    }

    const { data: existingRow, error: fetchError } = await supabaseAdmin
      .from('Sangpo_Unpaid_Invoice')
      .select('id, company_id, status')
      .eq('id', id)
      .eq('company_id', authorization.companyId)
      .single();

    if (fetchError || !existingRow) {
      return NextResponse.json({ error: 'Unpaid invoice not found' }, { status: 404 });
    }

    if (isAdmin) {
      if (!supplier_id || !invoice_number?.trim()) {
        return NextResponse.json(
          { error: 'Supplier and invoice number are required' },
          { status: 400 }
        );
      }

      const updates: Record<string, unknown> = {
        supplier_id,
        invoice_number: invoice_number.trim(),
        invoice_date: invoice_date || null,
        due_date: due_date || null,
        invoice_amount: Number(invoice_amount || 0),
        description: description?.trim() || null,
        remark: remark?.trim() || null,
        status: status || existingRow.status,
        updated_at: new Date().toISOString(),
      };

      if (project_id !== undefined) {
        updates.project_id = project_id || null;
      }

      const { data, error } = await supabaseAdmin
        .from('Sangpo_Unpaid_Invoice')
        .update(updates)
        .eq('id', id)
        .eq('company_id', authorization.companyId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ unpaidInvoice: data });
    }

    if (status === 'approved' || status === 'rejected' || status === 'pending_approval') {
      const { data, error } = await supabaseAdmin
        .from('Sangpo_Unpaid_Invoice')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('company_id', authorization.companyId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ unpaidInvoice: data });
    }

    return NextResponse.json(
      { error: 'Only admins can edit invoice details; approvers can only update approval status' },
      { status: 403 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update unpaid invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = await getAuthorizedUser(request);
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    if (authorization.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete unpaid invoices' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Unpaid invoice id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('Sangpo_Unpaid_Invoice')
      .delete()
      .eq('id', id)
      .eq('company_id', authorization.companyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete unpaid invoice' },
      { status: 500 }
    );
  }
}
