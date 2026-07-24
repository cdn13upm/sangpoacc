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

  const isAdmin = sangpoUser?.role === 'admin';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        backgroundColor: '#f3f4f6',
        padding: '1.5rem',
        borderRight: '1px solid #e5e7eb'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            SangpoAcc
          </h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/dashboard" style={sidebarLinkStyle}>
            Dashboard
          </Link>
          <Link href="/dashboard/suppliers" style={sidebarLinkStyle}>
            Suppliers
          </Link>
          <Link href="/dashboard/documents" style={sidebarLinkStyle}>
            Documents
          </Link>
          <Link href="/dashboard/payments" style={sidebarLinkStyle}>
            Payments
          </Link>
          <Link href="/dashboard/certificates" style={sidebarLinkStyle}>
            Certificates
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <form action="/auth/signout" method="post">
            <button style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#4b5563'
            }}>
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}

const sidebarLinkStyle = {
  padding: '0.5rem 0.75rem',
  borderRadius: '0.375rem',
  textDecoration: 'none',
  color: '#374151',
  transition: 'background-color 0.2s'
};
