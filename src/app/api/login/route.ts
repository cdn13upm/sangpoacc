import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    if (!identifier) {
      return NextResponse.json({ error: 'Email or username is required' }, { status: 400 });
    }

    if (identifier.includes('@')) {
      return NextResponse.json({ email: identifier.toLowerCase() });
    }

    const { data, error } = await supabaseAdmin
      .from('Sangpo_User')
      .select('email')
      .eq('username', normalizeUsername(identifier))
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data?.email) {
      return NextResponse.json({ error: 'Invalid login credentials' }, { status: 400 });
    }

    return NextResponse.json({ email: data.email.toLowerCase() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to resolve login' }, { status: 500 });
  }
}
