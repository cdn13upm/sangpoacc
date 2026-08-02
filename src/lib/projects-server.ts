import 'server-only';
import { cookies } from 'next/headers';

export function getActiveProjectId(): string | null {
  try {
    const cookieStore = cookies();
    return cookieStore.get('sangpo_project_id')?.value || null;
  } catch {
    return null;
  }
}
