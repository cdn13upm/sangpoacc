import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

// Define a type for the user data
type SangpoUser = {
  role: string;
  company_id: string | null;
  Sangpo_Company?: { name: string }[];
};

export default async function Dashboard() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch user's role and company with type assertion
  const { data: sangpoUser } = await supabase
    .from('Sangpo_User')
    .select('role, company_id, Sangpo_Company(name)')
    .eq('id', user.id)
    .single() as { data: SangpoUser | null };

  const cards = [
    { title: 'Suppliers', href: '/dashboard/suppliers' },
    { title: 'Documents', href: '/dashboard/documents' },
    { title: 'Payments', href: '/dashboard/payments' },
    { title: 'Certificates', href: '/dashboard/certificates' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: '800',
          color: '#111827',
          marginBottom: '0.5rem'
        }}>
          Dashboard
        </h1>
        {sangpoUser && (
          <p style={{ color: '#6b7280', fontSize: '1.05rem', margin: 0 }}>
            {sangpoUser.Sangpo_Company?.[0]?.name || 'No company assigned'} • <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{sangpoUser.role}</span>
          </p>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem'
      }}>
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              backgroundColor: 'white',
              padding: '2rem 1.75rem',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <h2 style={{
              fontSize: '1.35rem',
              fontWeight: '700',
              color: '#111827',
              margin: 0
            }}>
              {card.title}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
