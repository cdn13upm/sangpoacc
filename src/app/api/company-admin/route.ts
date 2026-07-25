import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getAuthorizedAdmin() {
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

  if (sangpoUser.role !== 'admin') {
    return { error: 'Only admin can manage company profiles and role mapping', status: 403 as const };
  }

  return {
    userId: user.id,
    currentCompanyId: sangpoUser.company_id,
  };
}

export async function GET() {
  try {
    const authorization = await getAuthorizedAdmin();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const [{ data: companies, error: companiesError }, { data: profiles, error: profilesError }, authUsersResult] =
      await Promise.all([
        supabaseAdmin.from('Sangpo_Company').select('id, name, address, phone, email, created_at, updated_at').order('name'),
        supabaseAdmin.from('Sangpo_User').select('id, company_id, role, username, email, created_at, updated_at').order('created_at', { ascending: true }),
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);

    if (companiesError) {
      return NextResponse.json({ error: companiesError.message }, { status: 400 });
    }

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 400 });
    }

    if (authUsersResult.error) {
      return NextResponse.json({ error: authUsersResult.error.message }, { status: 400 });
    }

    const companiesList = companies || [];
    const authUserMap = new Map(authUsersResult.data.users.map((authUser) => [authUser.id, authUser]));
    const companyMap = new Map(companiesList.map((company) => [company.id, company.name]));

    const users = (profiles || []).map((profile) => {
      const authUser = authUserMap.get(profile.id);
      return {
        ...profile,
        email: profile.email || authUser?.email || null,
        company_name: profile.company_id ? companyMap.get(profile.company_id) || null : null,
      };
    });

    return NextResponse.json({
      currentCompanyId: authorization.currentCompanyId,
      companies: companiesList,
      users,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load company admin data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await getAuthorizedAdmin();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const body = await request.json();
    const name = body?.name?.trim();

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('Sangpo_Company')
      .insert({
        name,
        address: body?.address?.trim() || null,
        phone: body?.phone?.trim() || null,
        email: body?.email?.trim()?.toLowerCase() || null,
        updated_at: new Date().toISOString(),
      })
      .select('id, name, address, phone, email, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ company: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create company' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authorization = await getAuthorizedAdmin();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const body = await request.json();
    const action = body?.action;

    if (action === 'company') {
      const id = body?.id;
      const name = body?.name?.trim();

      if (!id || !name) {
        return NextResponse.json({ error: 'Company id and name are required' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('Sangpo_Company')
        .update({
          name,
          address: body?.address?.trim() || null,
          phone: body?.phone?.trim() || null,
          email: body?.email?.trim()?.toLowerCase() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, name, address, phone, email, created_at, updated_at')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ company: data });
    }

    if (action === 'mapping') {
      const userId = body?.userId;
      const companyId = body?.company_id || null;
      const role = body?.role;

      if (!userId || !role) {
        return NextResponse.json({ error: 'User, role, and company are required' }, { status: 400 });
      }

      if (!['admin', 'manager', 'company_director'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('Sangpo_User')
        .update({
          company_id: companyId,
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('id, company_id, role, username, email, created_at, updated_at')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ mapping: data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update company admin data' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = await getAuthorizedAdmin();
    if ('error' in authorization) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('id');

    if (!companyId) {
      return NextResponse.json({ error: 'Company id is required' }, { status: 400 });
    }

    if (companyId === authorization.currentCompanyId) {
      return NextResponse.json({ error: 'You cannot delete your current company' }, { status: 400 });
    }

    const [
      { count: linkedUsers, error: usersError },
      { count: projectCount, error: projectError },
      { count: supplierCount, error: supplierError },
      { count: milestoneCount, error: milestoneError },
      { count: voCount, error: voError },
      { count: certificateCount, error: certificateError },
    ] = await Promise.all([
      supabaseAdmin.from('Sangpo_User').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
      supabaseAdmin.from('Sangpo_Project').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
      supabaseAdmin.from('Sangpo_Supplier').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
      supabaseAdmin.from('Sangpo_Milestone').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
      supabaseAdmin.from('Sangpo_Variation_Order').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
      supabaseAdmin.from('Sangpo_Certificate').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    ]);

    const firstError = usersError || projectError || supplierError || milestoneError || voError || certificateError;
    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const totalLinkedRecords =
      (linkedUsers || 0) +
      (projectCount || 0) +
      (supplierCount || 0) +
      (milestoneCount || 0) +
      (voCount || 0) +
      (certificateCount || 0);

    if (totalLinkedRecords > 0) {
      return NextResponse.json(
        {
          error: 'This company still has linked users or project records. Move or clean those records first before deleting.',
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from('Sangpo_Company').delete().eq('id', companyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete company' }, { status: 500 });
  }
}
