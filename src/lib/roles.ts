export type SangpoRole = 'admin' | 'manager' | 'company_director' | 'viewer';

export const assignableRoles: SangpoRole[] = ['admin', 'manager', 'company_director', 'viewer'];

const viewerAllowedDashboardPaths = [
  { pathname: '/dashboard', allowChildren: false },
  { pathname: '/dashboard/payments', allowChildren: true },
];

export function isSangpoRole(role: string | null | undefined): role is SangpoRole {
  return !!role && assignableRoles.includes(role as SangpoRole);
}

export function isViewerRole(role: string | null | undefined) {
  return role === 'viewer';
}

export function canAccessDashboardPath(role: string | null | undefined, pathname: string) {
  if (!isViewerRole(role)) {
    return true;
  }

  return viewerAllowedDashboardPaths.some(({ pathname: allowedPath, allowChildren }) =>
    pathname === allowedPath || (allowChildren && pathname.startsWith(`${allowedPath}/`))
  );
}
