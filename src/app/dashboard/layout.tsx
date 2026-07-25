import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardNavLink from './nav-link';
import { colors, contentWrapStyle } from './ui';

type SangpoUser = {
  role: string;
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch user's role
  const { data: sangpoUser } = await supabase
    .from('Sangpo_User')
    .select('role')
    .eq('id', user.id)
    .single() as { data: SangpoUser | null };

  const isAdmin = sangpoUser?.role === 'admin';

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    ...(isAdmin ? [{ href: '/dashboard/company', label: 'Company Admin' }] : []),
    { href: '/dashboard/project', label: 'Project Budget' },
    { href: '/dashboard/suppliers', label: 'Suppliers' },
    { href: '/dashboard/milestones', label: 'Milestones' },
    { href: '/dashboard/variation-orders', label: 'Variation Orders' },
    { href: '/dashboard/documents', label: 'Documents' },
    { href: '/dashboard/payments', label: 'Payments' },
    { href: '/dashboard/certificates', label: 'Certificates' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: `linear-gradient(180deg, ${colors.page} 0%, #ffffff 100%)` }}>
      <aside style={{
        width: '278px',
        background: 'linear-gradient(180deg, #6b1111 0%, #461010 100%)',
        padding: '1.25rem 1rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '18px 0 42px -30px rgba(0, 0, 0, 0.55)'
      }}>
        <div style={{ marginBottom: '1.5rem', borderRadius: '1rem', padding: '0.95rem', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img
              src="/logo.png"
              alt="Sangpo Buddhist Society"
              style={{ width: '42px', height: '42px', borderRadius: '999px', objectFit: 'cover', backgroundColor: 'white' }}
            />
            <div>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: '800',
                color: 'white',
                margin: 0,
                lineHeight: '1.2'
              }}>
                SangpoAcc
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.72)',
                fontSize: '0.76rem',
                margin: 0,
                marginTop: '0.15rem'
              }}>
                Renovation account control
              </p>
            </div>
          </div>
          <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <p style={{ color: 'rgba(255,255,255,0.64)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, marginBottom: '0.2rem' }}>
              Signed in as
            </p>
            <p style={{ color: 'white', fontSize: '0.95rem', fontWeight: '700', margin: 0, textTransform: 'capitalize' }}>
              {sangpoUser?.role || 'User'}
            </p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          {navItems.map((item) => (
            <DashboardNavLink
              key={item.href}
              href={item.href}
              label={item.label}
            />
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <form action="/auth/signout" method="post">
            <button style={{
              width: '100%',
              textAlign: 'center',
              padding: '0.85rem 1rem',
              borderRadius: '0.8rem',
              border: '1px solid rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '2rem 1.6rem 2.6rem' }}>
        <div style={contentWrapStyle}>
          {children}
        </div>
      </main>
    </div>
  );
}
