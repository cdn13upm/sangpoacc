import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

type SangpoUser = {
  role: string;
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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
    { href: '/dashboard/suppliers', label: 'Suppliers' },
    { href: '/dashboard/documents', label: 'Documents' },
    { href: '/dashboard/payments', label: 'Payments' },
    { href: '/dashboard/certificates', label: 'Certificates' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'linear-gradient(180deg, #780000 0%, #4a0000 100%)',
        padding: '2rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 15px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Logo and Title */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="https://i.imgur.com/3QwX7aL.png"
            alt="Sangpo Buddhist Society"
            style={{ width: '48px', height: '48px' }}
          />
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              color: 'white',
              margin: 0,
              lineHeight: '1.2'
            }}>
              SangpoAcc
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem',
              margin: 0,
              marginTop: '0.15rem'
            }}>
              Account Tracking
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                color: 'rgba(255,255,255,0.85)',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Info and Logout */}
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
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2.5rem' }}>
        {children}
      </main>
    </div>
  );
}
