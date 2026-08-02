import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveProjectId } from '@/lib/projects';
import { getServerLanguage } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/translations';
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
  status: string | null;
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
  const language = getServerLanguage();
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate(language, key, vars);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: sangpoUser } = await supabase
    .from('Sangpo_User')
    .select('role, company_id')
    .eq('id', user.id)
    .single() as { data: SangpoUser | null };

  const companyId = sangpoUser?.company_id;
  const activeProjectId = getActiveProjectId();

  const [{ data: company }, { data: project }, { data: suppliers }, { data: milestones }, { data: variationOrders }] = await Promise.all([
    companyId
      ? supabase.from('Sangpo_Company').select('name').eq('id', companyId).maybeSingle()
      : Promise.resolve({ data: null }),
    companyId
      ? activeProjectId
        ? supabase.from('Sangpo_Project').select('name, overall_budget').eq('company_id', companyId).eq('id', activeProjectId).maybeSingle()
        : supabase.from('Sangpo_Project').select('name, overall_budget').eq('company_id', companyId).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    companyId
      ? (() => {
          let query = supabase
            .from('Sangpo_Supplier')
            .select('id, name, contract_award_value, scope_of_work')
            .eq('company_id', companyId);
          if (activeProjectId) {
            query = query.eq('project_id', activeProjectId);
          }
          return query.order('name', { ascending: true });
        })()
      : Promise.resolve({ data: [] }),
    companyId
      ? (() => {
          let query = supabase
            .from('Sangpo_Milestone')
            .select('supplier_id, approved_invoice_total')
            .eq('company_id', companyId);
          if (activeProjectId) {
            query = query.eq('project_id', activeProjectId);
          }
          return query;
        })()
      : Promise.resolve({ data: [] }),
    companyId
      ? (() => {
          let query = supabase
            .from('Sangpo_Variation_Order')
            .select('supplier_id, amount, status')
            .eq('company_id', companyId);
          if (activeProjectId) {
            query = query.eq('project_id', activeProjectId);
          }
          return query;
        })()
      : Promise.resolve({ data: [] }),
  ]);

  const projectRecord = project as ProjectRecord | null;
  const supplierRows = (suppliers || []) as SupplierRecord[];
  const milestoneRows = (milestones || []) as MilestoneRecord[];
  const voRows = (variationOrders || []) as VariationOrderRecord[];
  const companyName = company?.name || null;

  const supplierCards = supplierRows.map((supplier) => {
    const awarded = Number(supplier.contract_award_value || 0);
    const approved = milestoneRows
      .filter((milestone) => milestone.supplier_id === supplier.id)
      .reduce((sum, milestone) => sum + Number(milestone.approved_invoice_total || 0), 0);
    const voTotal = voRows
      .filter((vo) => vo.supplier_id === supplier.id)
      .reduce((sum, vo) => sum + Number(vo.amount || 0), 0);
    const totalPayment = approved + voTotal;

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
      totalPayment,
      approvedPercent,
      voPercent,
      scope: supplier.scope_of_work || t('dashboard.scopeNotAdded'),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const totalAwarded = supplierCards.reduce((sum, item) => sum + item.awarded, 0);
  const totalApproved = supplierCards.reduce((sum, item) => sum + item.approved, 0);
  const totalVo = supplierCards.reduce((sum, item) => sum + item.voTotal, 0);
  const approvedVoPaymentAmount = voRows
    .filter((vo) => vo.status === 'approved')
    .reduce((sum, vo) => sum + Number(vo.amount || 0), 0);
  const projectBudget = Number(projectRecord?.overall_budget || 0);
  const committedValue = totalAwarded + totalVo;
  const committedAwardedContract = totalAwarded;
  const contractRemaining = committedAwardedContract - totalApproved;
  const cashFlowBalance = projectBudget - totalApproved - approvedVoPaymentAmount - contractRemaining;
  const remainingBudget = projectBudget - committedValue;
  const usagePercentRaw = projectBudget > 0 ? (committedValue / projectBudget) * 100 : 0;
  const usagePercent = clampPercent(usagePercentRaw);
  const budgetExceededPercent = Math.max(usagePercentRaw - 100, 0);
  const isOverBudget = remainingBudget < 0;

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={sectionTitleStyle}>{t('dashboard.title')}</h1>
          <p style={sectionSubtitleStyle}>
            {companyName || t('dashboard.noCompanyAssigned')} •{' '}
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
              {t('dashboard.projectOverview')}
            </p>
            <h2 style={{ margin: '0.35rem 0 0.55rem', fontSize: '1.8rem', fontWeight: 800 }}>
              {projectRecord?.name || t('dashboard.defaultProjectName')}
            </h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.82)', lineHeight: 1.7 }}>
              {t('dashboard.overviewText')}
            </p>
            <p style={{ margin: '1rem 0 0', color: 'rgba(255,255,255,0.78)', fontSize: '0.92rem', lineHeight: 1.65 }}>
              {t('dashboard.budgetLogic')}
            </p>
          </div>
          <div style={{ minWidth: '320px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <BudgetProgressRing percent={usagePercent} isOverBudget={isOverBudget} />
              <div style={{ minWidth: '220px' }}>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.84rem' }}>{t('dashboard.overallBudget')}</p>
                <p style={{ margin: '0.2rem 0 0.45rem', fontSize: '2rem', fontWeight: 800 }}>
                  {formatCurrency(projectBudget)}
                </p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.84rem' }}>
                  {isOverBudget ? t('dashboard.overBudgetAmount') : t('dashboard.remainingBalance')}
                </p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '1.75rem', fontWeight: 800, color: isOverBudget ? '#fecaca' : 'white' }}>
                  {formatCurrency(Math.abs(remainingBudget))}
                </p>
                <p style={{ margin: '0.45rem 0 0', color: isOverBudget ? '#fecaca' : 'rgba(255,255,255,0.78)', fontSize: '0.92rem', fontWeight: 700 }}>
                  {isOverBudget
                    ? t('dashboard.exceededBudgetBy', { value: budgetExceededPercent.toFixed(1) })
                    : t('dashboard.usingBudget', { value: usagePercentRaw.toFixed(1) })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...summaryGridStyle, marginBottom: '1.4rem' }}>
        <SummaryCard label={t('dashboard.suppliers')} value={String(supplierCards.length)} accent={colors.brand} />
        <SummaryCard label={t('dashboard.awardedContract')} value={formatCurrency(totalAwarded)} accent={colors.gold} />
        <SummaryCard label={t('dashboard.voTotal')} value={formatCurrency(totalVo)} accent={colors.warning} />
        <SummaryCard
          label={isOverBudget ? t('dashboard.overBudget') : t('dashboard.remainingBudget')}
          value={formatCurrency(Math.abs(remainingBudget))}
          accent={isOverBudget ? '#dc2626' : colors.success}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(300px, 1fr)', gap: '1rem', alignItems: 'start' }}>
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: colors.ink }}>{t('dashboard.supplierProgress')}</h2>
              <p style={{ ...sectionSubtitleStyle, fontSize: '0.92rem', marginTop: '0.25rem' }}>
                {t('dashboard.supplierProgressSubtitle')}
              </p>
            </div>
          </div>

          {supplierCards.length === 0 ? (
            <EmptyState message={t('dashboard.noSupplierData')} />
          ) : (
            <div style={{ display: 'grid', gap: '0.95rem' }}>
              {supplierCards.map((supplier) => (
                <SupplierProgressCard key={supplier.id} supplier={supplier} language={language} />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={panelStyle}>
            <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: colors.ink }}>{t('dashboard.financialSnapshot')}</h2>
            <div style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}>
              <SnapshotRow label={t('dashboard.projectBudget')} value={formatCurrency(projectRecord?.overall_budget || 0)} />
              <SnapshotRow label={t('dashboard.committedAwardedContract')} value={formatCurrency(committedAwardedContract)} />
              <SnapshotRow label={t('dashboard.approvedPaymentAmount')} value={formatCurrency(totalApproved)} />
              <SnapshotRow label={t('dashboard.contractRemaining')} value={formatCurrency(contractRemaining)} />
              <SnapshotRow label={t('dashboard.approvedVoPaymentAmount')} value={formatCurrency(approvedVoPaymentAmount)} />
              <SnapshotRow label={t('dashboard.cashFlowBalance')} value={formatCurrency(cashFlowBalance)} />
            </div>
          </div>

          <div style={panelStyle}>
            <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: colors.ink }}>{t('dashboard.workflowReminder')}</h2>
            <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
              <WorkflowItem title={t('dashboard.workflow1Title')} description={t('dashboard.workflow1Desc')} />
              <WorkflowItem title={t('dashboard.workflow2Title')} description={t('dashboard.workflow2Desc')} />
              <WorkflowItem title={t('dashboard.workflow3Title')} description={t('dashboard.workflow3Desc')} />
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
  language,
}: {
  supplier: {
    id: string;
    name: string;
    awarded: number;
    approved: number;
    balance: number;
    voTotal: number;
    totalPayment: number;
    approvedPercent: number;
    voPercent: number;
    scope: string;
  };
  language: 'en' | 'zh';
}) {
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate(language, key, vars);
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
          <span>{t('dashboard.approvedProgress')}</span>
          <strong style={{ color: colors.ink }}>{supplier.approvedPercent.toFixed(0)}%</strong>
        </div>
        <Link
          href={`/dashboard/payments?supplier=${supplier.id}`}
          style={{ display: 'block', textDecoration: 'none' }}
          title={t('dashboard.viewPaymentHistory', { name: supplier.name })}
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
        <MetricBlock label={t('dashboard.awardedContract')} value={formatCurrency(supplier.awarded)} />
        <MetricBlock label={t('dashboard.approvedAmount')} value={formatCurrency(supplier.approved)} />
        <MetricBlock label={t('dashboard.outstandingBalance')} value={formatCurrency(supplier.balance)} />
        <MetricBlock label={t('dashboard.voTotal')} value={formatCurrency(supplier.voTotal)} />
        <MetricBlock label={t('dashboard.totalPayment')} value={formatCurrency(supplier.totalPayment)} />
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
