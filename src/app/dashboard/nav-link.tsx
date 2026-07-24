'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colors } from './ui';

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
        padding: '0.85rem 0.95rem',
        borderRadius: '0.85rem',
        color: 'white',
        textDecoration: 'none',
        fontWeight: isActive ? '700' : '600',
        fontSize: '0.92rem',
        background: isActive ? 'linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)' : 'transparent',
        border: isActive ? `1px solid rgba(255,255,255,0.16)` : '1px solid transparent',
        boxShadow: isActive ? `inset 3px 0 0 0 ${colors.gold}` : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </Link>
  );
}
