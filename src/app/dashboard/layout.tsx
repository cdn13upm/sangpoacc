import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardNavLink from './nav-link';

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

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/project', label: 'Project Budget' },
    { href: '/dashboard/suppliers', label: 'Suppliers' },
    { href: '/dashboard/milestones', label: 'Milestones & VO' },
    { href: '/dashboard/documents', label: 'Documents' },
    { href: '/dashboard/payments', label: 'Payments' },
    { href: '/dashboard/certificates', label: 'Certificates' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <aside style={{
        width: '250px',
        background: 'linear-gradient(180deg, #780000 0%, #4a0000 100%)',
        padding: '1.2rem 0.95rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 15px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.2rem 0.3rem' }}>
          <img
            src="/logo.png"
            alt="Sangpo Buddhist Society"
            style={{ width: '34px', height: '34px', borderRadius: '999px', objectFit: 'cover' }}
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
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.74rem',
              margin: 0,
              marginTop: '0.15rem'
            }}>
              Account Tracking
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
          <div style={{ marginBottom: '0.75rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', margin: 0, marginBottom: '0.25rem' }}>
              Role
            </p>
            <p style={{
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '600',
              margin: 0,
              textTransform: 'capitalize'
            }}>
              {sangpoUser?.role || 'User'}
            </p>
          </div>
          <form action="/auth/signout" method="post">
            <button style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.8rem 0.95rem',
              borderRadius: '0.7rem',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '2rem 1.6rem' }}>
        {children}
      </main>
    </div>
  );
}
