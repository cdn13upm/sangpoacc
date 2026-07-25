import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  colors,
  pageHeaderStyle,
  panelStyle,
  sectionSubtitleStyle,
  sectionTitleStyle,
  summaryCardStyle,
  summaryGridStyle,
} from './ui';

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
  scope_of_work: string | null;
};

type MilestoneRecord = {
  supplier_id: string;
  approved_invoice_total: number | null;
};

type VariationOrderRecord = {
  supplier_id: string;
  amount: number | null;
};

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
      ? supabase
          .from('Sangpo_Supplier')
          .select('id, name, contract_award_value, scope_of_work')
          .eq('company_id', companyId)
          .order('name', { ascending: true })
      : Promise.resolve({ data: [] }),
    companyId
      ? supabase.from('Sangpo_Milestone').select('supplier_id, approved_invoice_total').eq('company_id', companyId)
      : Promise.resolve({ data: [] }),
    companyId
      ? supabase.from('Sangpo_Variation_Order').select('supplier_id, amount').eq('company_id', companyId)
      : Promise.resolve({ data: [] }),
  ]);

  const projectRecord = project as ProjectRecord | null;
  const supplierRows = (suppliers || []) as SupplierRecord[];
  const milestoneRows = (milestones || []) as MilestoneRecord[];
  const voRows = (variationOrders || []) as VariationOrderRecord[];

  const supplierCards = supplierRows.map((supplier) => {
    const awarded = Number(supplier.contract_award_value || 0);
    const approved = milestoneRows
      .filter((milestone) => milestone.supplier_id === supplier.id)
      .reduce((sum, milestone) => sum + Number(milestone.approved_invoice_total || 0), 0);
    const voTotal = voRows
      .filter((vo) => vo.supplier_id === supplier.id)
      .reduce((sum, vo) => sum + Number(vo.amount || 0), 0);

    const approvedPercent = awarded > 0 ? clampPercent((approved / awarded) * 100) : 0;
    const voPercent = awarded > 0 ? (voTotal / awarded) * 100 : 0;
    const balance = Math.max(awarded - approved, 0);

    return {
      id: supplier.id,
      name: supplier.name,
      awarded,
      approved,
      balance,
      voTotal,
      approvedPercent,
      voPercent,
      scope: supplier.scope_of_work || 'Scope not added yet',
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const totalAwarded = supplierCards.reduce((sum, item) => sum + item.awarded, 0);
  const totalApproved = supplierCards.reduce((sum, item) => sum + item.approved, 0);
  const totalVo = supplierCards.reduce((sum, item) => sum + item.voTotal, 0);
  const projectBudget = Number(projectRecord?.overall_budget || 0);
  const committedValue = totalAwarded + totalVo;
  const remainingBudget = projectBudget - committedValue;
  const usagePercentRaw = projectBudget > 0 ? (committedValue / projectBudget) * 100 : 0;
  const usagePercent = clampPercent(usagePercentRaw);
  const budgetExceededPercent = Math.max(usagePercentRaw - 100, 0);
  const isOverBudget = remainingBudget < 0;

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={sectionTitleStyle}>Dashboard</h1>
          <p style={sectionSubtitleStyle}>
            {sangpoUser?.Sangpo_Company?.[0]?.name || 'No company assigned'} •{' '}
            <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{sangpoUser?.role || 'user'}</span>
          </p>
        </div>
      </div>

      <div
        style={{
          ...panelStyle,
          marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, rgba(127,29,29,0.98) 0%, rgba(94,20,20,1) 68%, rgba(192,138,43,0.82) 100%)',
          color: 'white',
          border: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '700px' }}>
            <p style={{ margin: 0, fontSize: '0.82rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
              Project Overview
            </p>
            <h2 style={{ margin: '0.35rem 0 0.55rem', fontSize: '1.8rem', fontWeight: 800 }}>
              {projectRecord?.name || 'Sangpo Temple Renovation Account'}
            </h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.82)', lineHeight: 1.7 }}>
              Track contract awards, approved certificates, outstanding balances, and VO growth without mixing original award values.
            </p>
            <p style={{ margin: '1rem 0 0', color: 'rgba(255,255,255,0.78)', fontSize: '0.92rem', lineHeight: 1.65 }}>
              Budget logic: Total Awarded Contract + Total VO = committed value. Remaining balance is based on the project budget after deducting that committed value.
            </p>
          </div>
          <div style={{ minWidth: '320px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <BudgetProgressRing percent={usagePercent} isOverBudget={isOverBudget} />
              <div style={{ minWidth: '220px' }}>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.84rem' }}>Overall Budget</p>
                <p style={{ margin: '0.2rem 0 0.45rem', fontSize: '2rem', fontWeight: 800 }}>
                  {formatCurrency(projectBudget)}
                </p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.84rem' }}>
                  {isOverBudget ? 'Over Budget Amount' : 'Remaining Balance'}
                </p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '1.75rem', fontWeight: 800, color: isOverBudget ? '#fecaca' : 'white' }}>
                  {formatCurrency(Math.abs(remainingBudget))}
                </p>
                <p style={{ margin: '0.45rem 0 0', color: isOverBudget ? '#fecaca' : 'rgba(255,255,255,0.78)', fontSize: '0.92rem', fontWeight: 700 }}>
                  {isOverBudget
                    ? `Exceeded budget by ${budgetExceededPercent.toFixed(1)}%`
                    : `Using ${usagePercentRaw.toFixed(1)}% of project budget`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...summaryGridStyle, marginBottom: '1.4rem' }}>
        <SummaryCard label="Suppliers" value={String(supplierCards.length)} accent={colors.brand} />
        <SummaryCard label="Awarded Contract" value={formatCurrency(totalAwarded)} accent={colors.gold} />
        <SummaryCard label="VO Total" value={formatCurrency(totalVo)} accent={colors.warning} />
        <SummaryCard
          label={isOverBudget ? 'Over Budget' : 'Remaining Budget'}
          value={formatCurrency(Math.abs(remainingBudget))}
          accent={isOverBudget ? '#dc2626' : colors.success}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(300px, 1fr)', gap: '1rem', alignItems: 'start' }}>
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: colors.ink }}>Supplier Progress</h2>
              <p style={{ ...sectionSubtitleStyle, fontSize: '0.92rem', marginTop: '0.25rem' }}>
                Cleaner contract progress by supplier, with VO shown separately.
              </p>
            </div>
          </div>

          {supplierCards.length === 0 ? (
            <EmptyState message="No supplier data yet. Add suppliers with contract awards to start seeing progress." />
          ) : (
            <div style={{ display: 'grid', gap: '0.95rem' }}>
              {supplierCards.map((supplier) => (
                <SupplierProgressCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={panelStyle}>
            <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: colors.ink }}>Financial Snapshot</h2>
            <div style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}>
              <SnapshotRow label="Project Budget" value={formatCurrency(projectRecord?.overall_budget || 0)} />
              <SnapshotRow label="Committed Value" value={formatCurrency(committedValue)} />
              <SnapshotRow label="Approved Amount" value={formatCurrency(totalApproved)} />
              <SnapshotRow label="Total VO" value={formatCurrency(totalVo)} />
              <SnapshotRow label="Milestones" value={String(milestoneRows.length)} />
            </div>
          </div>

          <div style={panelStyle}>
            <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: colors.ink }}>Workflow Reminder</h2>
            <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
              <WorkflowItem title="1. Set project budget" description="Keep the base budget clear before supplier awards and claims." />
              <WorkflowItem title="2. Track supplier awards" description="Original awarded contracts stay fixed while VO increases are recorded separately." />
              <WorkflowItem title="3. Prepare certificates" description="Admin prepares the certificate, then submits it for manager approval." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetProgressRing({ percent, isOverBudget }: { percent: number; isOverBudget: boolean }) {
  const ringColor = isOverBudget ? '#ef4444' : '#22c55e';
  const trackColor = 'rgba(255,255,255,0.18)';

  return (
    <div
      style={{
        width: '74px',
        height: '74px',
        borderRadius: '999px',
        background: `conic-gradient(${ringColor} 0 ${percent}%, ${trackColor} ${percent}% 100%)`,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '999px',
          backgroundColor: 'rgba(94,20,20,0.96)',
          display: 'grid',
          placeItems: 'center',
          color: 'white',
          fontWeight: 800,
          fontSize: '1.2rem',
        }}
      >
        {percent.toFixed(0)}%
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={summaryCardStyle}>
      <div style={{ width: '42px', height: '5px', borderRadius: '999px', backgroundColor: accent, marginBottom: '0.9rem' }} />
      <p style={{ fontSize: '0.8rem', color: colors.muted, margin: 0, marginBottom: '0.3rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.45rem', color: colors.ink, margin: 0, fontWeight: 800 }}>{value}</p>
    </div>
  );
}

function SupplierProgressCard({
  supplier,
}: {
  supplier: {
    id: string;
    name: string;
    awarded: number;
    approved: number;
    balance: number;
    voTotal: number;
    approvedPercent: number;
    voPercent: number;
    scope: string;
  };
}) {
  const voBadgeStyle = supplier.voTotal > 0
    ? { color: colors.warning, backgroundColor: colors.warningTint, borderColor: '#fcd34d' }
    : { color: colors.success, backgroundColor: colors.successTint, borderColor: '#86efac' };

  return (
    <div
      style={{
        border: '1px solid #ece7e5',
        borderRadius: '1rem',
        padding: '1rem 1.05rem',
        background: 'linear-gradient(180deg, #ffffff 0%, #fcfcfb 100%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1.02rem', color: colors.ink, fontWeight: 800 }}>{supplier.name}</h3>
          <p style={{ margin: '0.3rem 0 0', color: colors.muted, fontSize: '0.9rem', lineHeight: 1.55 }}>
            {supplier.scope}
          </p>
        </div>
        <div
          style={{
            padding: '0.38rem 0.7rem',
            borderRadius: '999px',
            border: `1px solid ${voBadgeStyle.borderColor}`,
            color: voBadgeStyle.color,
            backgroundColor: voBadgeStyle.backgroundColor,
            fontSize: '0.82rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          VO {supplier.voPercent.toFixed(1)}%
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.45rem', fontSize: '0.88rem', color: colors.muted }}>
          <span>Approved Progress</span>
          <strong style={{ color: colors.ink }}>{supplier.approvedPercent.toFixed(0)}%</strong>
        </div>
        <Link
          href={`/dashboard/payments?supplier=${supplier.id}`}
          style={{ display: 'block', textDecoration: 'none' }}
          title={`View ${supplier.name} payment history`}
        >
          <div style={{ width: '100%', height: '10px', borderRadius: '999px', backgroundColor: '#ebe7e5', overflow: 'hidden', cursor: 'pointer' }}>
            <div
              style={{
                width: `${supplier.approvedPercent}%`,
                height: '100%',
                borderRadius: '999px',
                background: `linear-gradient(90deg, ${colors.brand} 0%, ${colors.gold} 100%)`,
              }}
            />
          </div>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem 1rem' }}>
        <MetricBlock label="Awarded Contract" value={formatCurrency(supplier.awarded)} />
        <MetricBlock label="Approved Amount" value={formatCurrency(supplier.approved)} />
        <MetricBlock label="Outstanding Balance" value={formatCurrency(supplier.balance)} />
        <MetricBlock label="VO Total" value={formatCurrency(supplier.voTotal)} />
      </div>
    </div>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: 0, color: colors.muted, fontSize: '0.8rem', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ margin: 0, color: colors.ink, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
      <span style={{ color: colors.muted, fontSize: '0.92rem' }}>{label}</span>
      <strong style={{ color: colors.ink }}>{value}</strong>
    </div>
  );
}

function WorkflowItem({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ padding: '0.85rem 0.95rem', borderRadius: '0.95rem', backgroundColor: colors.panelSoft, border: '1px solid #ede9e7' }}>
      <p style={{ margin: 0, fontWeight: 700, color: colors.ink }}>{title}</p>
      <p style={{ margin: '0.35rem 0 0', color: colors.muted, fontSize: '0.9rem', lineHeight: 1.55 }}>{description}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: colors.panelSoft, color: colors.muted, border: '1px dashed #d6d3d1' }}>
      {message}
    </div>
  );
}
