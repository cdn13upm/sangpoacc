import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type SangpoUser = {
  role: string;
  company_id: string | null;
  Sangpo_Company?: { name: string }[];
};

type ProjectRecord = {
  name: string;
  overall_budget: number | null;
};

type SupplierRecord = {
  id: string;
  name: string;
  contract_award_value: number | null;
};

type MilestoneRecord = {
  supplier_id: string;
  approved_invoice_total: number | null;
  manual_paid_total: number | null;
};

type VariationOrderRecord = {
  supplier_id: string;
  amount: number | null;
};

const ringColors = ['#f472b6', '#4dd0e1', '#f5b041', '#7ac943', '#4c6fff', '#ff5a5f', '#a66a6a', '#6b7280'];

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export default async function Dashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: sangpoUser } = await supabase
    .from('Sangpo_User')
    .select('role, company_id, Sangpo_Company(name)')
    .eq('id', user.id)
    .single() as { data: SangpoUser | null };

  const companyId = sangpoUser?.company_id;

  const [{ data: project }, { data: suppliers }, { data: milestones }, { data: variationOrders }] = await Promise.all([
    companyId
      ? supabase.from('Sangpo_Project').select('name, overall_budget').eq('company_id', companyId).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    companyId
      ? supabase.from('Sangpo_Supplier').select('id, name, contract_award_value').eq('company_id', companyId).order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),
    companyId
      ? supabase.from('Sangpo_Milestone').select('supplier_id, approved_invoice_total, manual_paid_total').eq('company_id', companyId)
      : Promise.resolve({ data: [] }),
    companyId
      ? supabase.from('Sangpo_Variation_Order').select('supplier_id, amount').eq('company_id', companyId)
      : Promise.resolve({ data: [] }),
  ]);

  const projectRecord = project as ProjectRecord | null;
  const supplierRows = (suppliers || []) as SupplierRecord[];
  const milestoneRows = (milestones || []) as MilestoneRecord[];
  const voRows = (variationOrders || []) as VariationOrderRecord[];

  const supplierCards = supplierRows.map((supplier, index) => {
    const awarded = Number(supplier.contract_award_value || 0);
    const approved = milestoneRows
      .filter((milestone) => milestone.supplier_id === supplier.id)
      .reduce((sum, milestone) => sum + Number(milestone.approved_invoice_total || 0), 0);
    const voTotal = voRows
      .filter((vo) => vo.supplier_id === supplier.id)
      .reduce((sum, vo) => sum + Number(vo.amount || 0), 0);

    const progressPercent = awarded > 0 ? clampPercent((approved / awarded) * 100) : 0;
    const voPercent = awarded > 0 ? (voTotal / awarded) * 100 : 0;
    const balance = Math.max(awarded - approved, 0);

    return {
      id: supplier.id,
      name: supplier.name,
      awarded,
      approved,
      balance,
      voTotal,
      progressPercent,
      voPercent,
      ringColor: ringColors[index % ringColors.length],
    };
  });

  return (
    <div>
      <div style={{ marginBottom: '1.4rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#111827', margin: 0, marginBottom: '0.35rem' }}>
          Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.98rem', margin: 0 }}>
          {sangpoUser?.Sangpo_Company?.[0]?.name || 'No company assigned'} •{' '}
          <span style={{ textTransform: 'capitalize', fontWeight: '700' }}>{sangpoUser?.role || 'user'}</span>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.6rem' }}>
        <SummaryCard
          label="Project Name"
          value={projectRecord?.name || 'Sangpo Temple Renovation Account'}
        />
        <SummaryCard
          label="Overall Budget"
          value={formatCurrency(projectRecord?.overall_budget || 0)}
        />
      </div>

      <div
        style={{
          position: 'relative',
          backgroundColor: '#f3f4f6',
          borderRadius: '1rem',
          padding: '1.35rem 1rem 1rem',
          minHeight: '420px',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.72), transparent 35%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.55), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0))',
            pointerEvents: 'none',
          }}
        />

        {supplierCards.length === 0 ? (
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              border: '1px solid rgba(0,0,0,0.05)',
              color: '#6b7280',
            }}
          >
            No supplier data yet. Add suppliers with contract awards to start seeing dashboard progress.
          </div>
        ) : (
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.4rem 1.15rem',
            }}
          >
            {supplierCards.map((supplier) => (
              <SupplierProgressCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '0.9rem',
        padding: '0.8rem 1rem',
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
      }}
    >
      <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0, marginBottom: '0.2rem', fontWeight: '600' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.45rem', color: '#111827', margin: 0, fontWeight: '800' }}>{value}</p>
    </div>
  );
}

function SupplierProgressCard({
  supplier,
}: {
  supplier: {
    name: string;
    awarded: number;
    approved: number;
    balance: number;
    voTotal: number;
    progressPercent: number;
    voPercent: number;
    ringColor: string;
  };
}) {
  return (
    <div
      style={{
        backgroundColor: 'transparent',
        padding: '0.2rem 0.2rem 0.1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.55rem' }}>
        <div
          style={{
            width: '150px',
            height: '150px',
            borderRadius: '999px',
            border: `4px solid ${supplier.ringColor}`,
            backgroundColor: 'rgba(255,255,255,0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '1rem',
            color: '#374151',
            fontWeight: '600',
            lineHeight: 1.3,
            boxSizing: 'border-box',
          }}
        >
          <span style={{ maxWidth: '100%' }}>{supplier.name}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.2rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111827' }}>
          {supplier.progressPercent.toFixed(0)}%
        </span>
      </div>

      <div style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.6 }}>
        <div>Awarded Contract : {formatCurrency(supplier.awarded)}</div>
        <div>Approved Payment : {formatCurrency(supplier.approved)}</div>
        <div>Balance Amount : {formatCurrency(supplier.balance)}</div>
        <div style={{ color: '#ef4444', fontWeight: '700' }}>Total approved VO: {formatCurrency(supplier.voTotal)}</div>
        <div style={{ color: '#ef4444', fontWeight: '800', fontSize: '1rem' }}>
          VO Percentage - {supplier.voPercent.toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
