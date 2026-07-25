import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SECRET_CODE = process.env.INTERNAL_ACCESS_CODE || 'S@ngpo9088';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = body?.identifier?.trim();
    const password = body?.password;
    const secretCode = body?.secretCode;

    if (!identifier || !password || !secretCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (secretCode !== SECRET_CODE) {
      return NextResponse.json({ error: 'Invalid secret code' }, { status: 403 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    let profileQuery = supabaseAdmin.from('Sangpo_User').select('id').limit(1);

    if (identifier.includes('@')) {
      profileQuery = profileQuery.ilike('email', identifier.toLowerCase());
    } else {
      profileQuery = profileQuery.ilike('username', normalizeUsername(identifier));
    }

    const { data: profile, error: profileError } = await profileQuery.maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    if (!profile?.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password: String(password),
    });

    if (resetError) {
      return NextResponse.json({ error: resetError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 });
  }
}
