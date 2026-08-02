export function getActiveProjectIdFromRequest(request: Request): string | null {
  try {
    const headerId = request.headers.get('X-Sangpo-Project-Id');
    if (headerId) return headerId;
  } catch {}

  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader
      .split('; ')
      .find((row) => row.startsWith('sangpo_project_id='));
    if (!match) return null;
    return decodeURIComponent(match.split('=')[1]);
  } catch {
    return null;
  }
}

export async function resolveActiveProjectId(
  supabaseAdmin: any,
  companyId: string,
  overrideId: string | null
): Promise<string | null> {
  if (overrideId) {
    const { data: existing } = await supabaseAdmin
      .from('Sangpo_Project')
      .select('id')
      .eq('id', overrideId)
      .eq('company_id', companyId)
      .maybeSingle();
    if (existing) return existing.id;
  }

  const { data: rows } = await supabaseAdmin
    .from('Sangpo_Project')
    .select('id, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(2);

  const list = rows || [];
  if (list.length === 0) {
    const { data: inserted, error } = await supabaseAdmin
      .from('Sangpo_Project')
      .insert({
        company_id: companyId,
        name: 'Sangpo Temple Renovation Account',
        overall_budget: 0,
        notes: null,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !inserted) return null;
    return inserted.id;
  }
  return list[0].id;
}

export function getClientActiveProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('sangpo_project_id') || getDocumentProjectCookie();
  } catch {
    return getDocumentProjectCookie();
  }
}

function getDocumentProjectCookie(): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith('sangpo_project_id='));
    if (!match) return null;
    return decodeURIComponent(match.split('=')[1]);
  } catch {
    return null;
  }
}

export function getClientActiveProjectHeader(): Record<string, string> {
  const id = getClientActiveProjectId();
  if (!id) return {};
  return { 'X-Sangpo-Project-Id': id };
}
