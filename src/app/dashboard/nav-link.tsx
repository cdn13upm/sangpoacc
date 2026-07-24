'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardNavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.8rem 0.95rem',
        borderRadius: '0.7rem',
        color: 'white',
        textDecoration: 'none',
        fontWeight: isActive ? '700' : '600',
        fontSize: '0.92rem',
        backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: isActive ? '1.5px solid rgba(96, 165, 250, 0.95)' : '1.5px solid transparent',
        boxShadow: isActive ? 'inset 0 0 0 1px rgba(255,255,255,0.08)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </Link>
  );
}
