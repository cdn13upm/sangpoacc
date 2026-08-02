import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PaymentSupplierFilter from './supplier-filter';
import PaymentPrintWrapper from './print-wrapper';
import {
  bodyCellStyle,
  colors,
  fieldWrapStyle,
  headerCellStyle,
  labelStyle,
  pageHeaderStyle,
  panelStyle,
  panelTitleStyle,
  sectionSubtitleStyle,
  sectionTitleStyle,
  summaryCardStyle,
  summaryGridStyle,
  tableWrapStyle,
} from '../ui';

type SangpoUser = {
  role: string;
  company_id: string | null;
};

type CompanyRecord = {
  name: string | null;
};

type SupplierRecord = {
  id: string;
  name: string;
  contract_award_value: number | null;
  scope_of_work: string | null;
};

type MilestoneRecord = {
  id: string;
  supplier_id: string;
  title: string;
  description: string | null;
  milestone_amount: number | null;
  approved_invoice_total: number | null;
  payment_date: string | null;
  payment_reference: string | null;
};

type VariationOrderRecord = {
  id: string;
  supplier_id: string;
  vo_number: string;
  description: string | null;
  amount: number | null;
  payment_date: string | null;
  payment_reference: string | null;
  status: string;
};

function formatCurrency(value: number | null | undefined) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(safeValue);
}

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function formatReportDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-MY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams?: { supplier?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: sangpoUser } = (await supabase
    .from('Sangpo_User')
    .select('role, company_id')
    .eq('id', user.id)
    .single()) as { data: SangpoUser | null };

  const companyId = sangpoUser?.company_id;

  const [{ data: company }, { data: suppliers }, { data: milestones }, { data: variationOrders }] = await Promise.all([
    companyId
      ? supabase.from('Sangpo_Company').select('name').eq('id', companyId).maybeSingle()
      : Promise.resolve({ data: null }),
    companyId
      ? supabase
          .from('Sangpo_Supplier')
          .select('id, name, contract_award_value, scope_of_work')
          .eq('company_id', companyId)
          .order('name', { ascending: true })
      : Promise.resolve({ data: [] }),
    companyId
      ? supabase
          .from('Sangpo_Milestone')
          .select(
            'id, supplier_id, title, description, milestone_amount, approved_invoice_total, payment_date, payment_reference'
          )
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    companyId
      ? supabase
          .from('Sangpo_Variation_Order')
          .select('id, supplier_id, vo_number, description, amount, payment_date, payment_reference, status')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const companyRecord = company as CompanyRecord | null;
  const supplierRows = (suppliers || []) as SupplierRecord[];
  const milestoneRows = (milestones || []) as MilestoneRecord[];
  const voRows = (variationOrders || []) as VariationOrderRecord[];

  const selectedSupplier =
    supplierRows.find((supplier) => supplier.id === searchParams?.supplier) || supplierRows[0] || null;

  const selectedSupplierId = selectedSupplier?.id || '';
  const selectedMilestones = selectedSupplierId
    ? milestoneRows.filter((item) => item.supplier_id === selectedSupplierId)
    : [];
  const selectedVos = selectedSupplierId
    ? voRows.filter((item) => item.supplier_id === selectedSupplierId)
    : [];

  const awarded = safeNumber(selectedSupplier?.contract_award_value || 0);
  const approved = selectedMilestones.reduce(
    (sum, item) => sum + safeNumber(item.approved_invoice_total),
    0
  );
  const voTotal = selectedVos.reduce((sum, item) => sum + safeNumber(item.amount), 0);
  const totalPayment = safeNumber(approved) + safeNumber(voTotal);
  const balance = Math.max(safeNumber(awarded) - safeNumber(approved), 0);
  const approvedPercent = awarded > 0 ? clampPercent((safeNumber(approved) / safeNumber(awarded)) * 100) : 0;
  const voPercent = awarded > 0 ? (safeNumber(voTotal) / safeNumber(awarded)) * 100 : 0;

  const generatedAt = new Intl.DateTimeFormat('en-MY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());

  const summaryForPrint = [
    { label: 'Awarded Contract', value: formatCurrency(awarded) },
    { label: 'Approved Amount', value: formatCurrency(approved) },
    { label: 'Outstanding Balance', value: formatCurrency(balance) },
    { label: 'VO Total', value: formatCurrency(voTotal) },
    { label: 'Total Payment', value: formatCurrency(totalPayment) },
    { label: 'Milestone Records', value: String(selectedMilestones.length) },
    { label: 'VO Records', value: String(selectedVos.length) },
  ];

  const milestoneRowsForPrint = selectedMilestones.map((item) => ({
    title: item.title,
    approved: formatCurrency(item.approved_invoice_total),
    date: formatDate(item.payment_date),
    reference: item.payment_reference || '-',
    balance: formatCurrency(
      safeNumber(item.milestone_amount) - safeNumber(item.approved_invoice_total)
    ),
    description: item.description || '-',
  }));

  const voRowsForPrint = selectedVos.map((item) => ({
    voNumber: item.vo_number,
    amount: formatCurrency(item.amount),
    date: formatDate(item.payment_date),
    reference: item.payment_reference || '-',
    status: item.status,
    description: item.description || '-',
  }));

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={sectionTitleStyle}>Payment History</h1>
          <p style={sectionSubtitleStyle}>
            Review approved milestone payments and VO payment records by supplier.
          </p>
        </div>
      </div>

      <PaymentPrintWrapper
        companyName={companyRecord?.name || null}
        supplierName={selectedSupplier?.name || null}
        generatedAt={generatedAt}
        summary={summaryForPrint}
        milestoneRecords={milestoneRowsForPrint}
        voRecords={voRowsForPrint}
      >
        {supplierRows.length === 0 ? (
          <div style={panelStyle}>
            <p style={{ margin: 0, color: colors.muted }}>
              No suppliers found yet. Add suppliers first to review payment history.
            </p>
          </div>
        ) : (
          <>
            <div style={{ ...panelStyle, marginBottom: '1.5rem', maxWidth: '960px' }}>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Supplier</label>
                <PaymentSupplierFilter
                  suppliers={supplierRows.map(({ id, name }) => ({ id, name }))}
                  selectedSupplierId={selectedSupplierId}
                />
              </div>
            </div>

            {selectedSupplier && (
              <div style={{ ...panelStyle, marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    marginBottom: '0.8rem',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '1.08rem',
                        color: colors.ink,
                        fontWeight: 800,
                      }}
                    >
                      {selectedSupplier.name}
                    </h2>
                    <p
                      style={{
                        margin: '0.3rem 0 0',
                        color: colors.muted,
                        fontSize: '0.9rem',
                        lineHeight: 1.55,
                      }}
                    >
                      {selectedSupplier.scope_of_work || 'Scope not added yet'}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '0.38rem 0.7rem',
                      borderRadius: '999px',
                      border: `1px solid ${voTotal > 0 ? '#fcd34d' : '#86efac'}`,
                      color: voTotal > 0 ? colors.warning : colors.success,
                      backgroundColor: voTotal > 0 ? colors.warningTint : colors.successTint,
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    VO {voPercent.toFixed(1)}%
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      marginBottom: '0.45rem',
                      fontSize: '0.88rem',
                      color: colors.muted,
                    }}
                  >
                    <span>Approved Progress</span>
                    <strong style={{ color: colors.ink }}>
                      {approvedPercent.toFixed(0)}%
                    </strong>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '10px',
                      borderRadius: '999px',
                      backgroundColor: '#ebe7e5',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${approvedPercent}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: `linear-gradient(90deg, ${colors.brand} 0%, ${colors.gold} 100%)`,
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '0.75rem 1rem',
                  }}
                >
                  <MetricBlock label="Awarded Contract" value={formatCurrency(awarded)} />
                  <MetricBlock label="Approved Amount" value={formatCurrency(approved)} />
                  <MetricBlock label="Outstanding Balance" value={formatCurrency(balance)} />
                  <MetricBlock label="VO Total" value={formatCurrency(voTotal)} />
                  <MetricBlock label="Total Payment" value={formatCurrency(totalPayment)} />
                </div>
              </div>
            )}

            <div style={{ ...summaryGridStyle, marginBottom: '1.5rem' }}>
              <SummaryCard label="Milestone Records" value={String(selectedMilestones.length)} />
              <SummaryCard label="VO Records" value={String(selectedVos.length)} />
              <SummaryCard
                label="Recorded Payments"
                value={String(
                  selectedMilestones.filter((item) => item.payment_date || item.payment_reference)
                    .length +
                    selectedVos.filter((item) => item.payment_date || item.payment_reference)
                      .length
                )}
              />
            </div>

            <div style={{ ...panelStyle, marginBottom: '1.5rem' }}>
              <h2 style={panelTitleStyle}>Payment Records</h2>
              <div style={tableWrapStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1020px' }}>
                  <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <HeaderCell>Supplier</HeaderCell>
                      <HeaderCell>Milestone</HeaderCell>
                      <HeaderCell>Approved Payment</HeaderCell>
                      <HeaderCell>Payment Date</HeaderCell>
                      <HeaderCell>Reference</HeaderCell>
                      <HeaderCell>Balance</HeaderCell>
                      <HeaderCell>Description</HeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMilestones.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            padding: '2rem 1rem',
                            textAlign: 'center',
                            color: colors.muted,
                          }}
                        >
                          No milestone payment records for this supplier.
                        </td>
                      </tr>
                    ) : (
                      selectedMilestones.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <BodyCell>{selectedSupplier?.name || '-'}</BodyCell>
                          <BodyCell>{item.title}</BodyCell>
                          <BodyCell>{formatCurrency(item.approved_invoice_total)}</BodyCell>
                          <BodyCell>{formatDate(item.payment_date)}</BodyCell>
                          <BodyCell>{item.payment_reference || '-'}</BodyCell>
                          <BodyCell>
                            {formatCurrency(
                              safeNumber(item.milestone_amount) -
                                safeNumber(item.approved_invoice_total)
                            )}
                          </BodyCell>
                          <BodyCell>{item.description || '-'}</BodyCell>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={panelStyle}>
              <h2 style={panelTitleStyle}>VO Payment Records</h2>
              <div style={tableWrapStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1020px' }}>
                  <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <HeaderCell>Supplier</HeaderCell>
                      <HeaderCell>VO Number</HeaderCell>
                      <HeaderCell>Approved Payment</HeaderCell>
                      <HeaderCell>Payment Date</HeaderCell>
                      <HeaderCell>Reference</HeaderCell>
                      <HeaderCell>Status</HeaderCell>
                      <HeaderCell>Description</HeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVos.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            padding: '2rem 1rem',
                            textAlign: 'center',
                            color: colors.muted,
                          }}
                        >
                          No VO payment records for this supplier.
                        </td>
                      </tr>
                    ) : (
                      selectedVos.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <BodyCell>{selectedSupplier?.name || '-'}</BodyCell>
                          <BodyCell>{item.vo_number}</BodyCell>
                          <BodyCell>{formatCurrency(item.amount)}</BodyCell>
                          <BodyCell>{formatDate(item.payment_date)}</BodyCell>
                          <BodyCell>{item.payment_reference || '-'}</BodyCell>
                          <BodyCell>{item.status}</BodyCell>
                          <BodyCell>{item.description || '-'}</BodyCell>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </PaymentPrintWrapper>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryCardStyle}>
      <p
        style={{
          color: colors.muted,
          fontSize: '0.82rem',
          margin: 0,
          marginBottom: '0.35rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: colors.ink,
          fontSize: '1.2rem',
          fontWeight: 800,
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: 0, color: colors.muted, fontSize: '0.8rem', marginBottom: '0.25rem' }}>
        {label}
      </p>
      <p style={{ margin: 0, color: colors.ink, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function HeaderCell({ children }: { children: ReactNode }) {
  return <th style={headerCellStyle}>{children}</th>;
}

function BodyCell({ children }: { children: ReactNode }) {
  return <td style={bodyCellStyle}>{children}</td>;
}
