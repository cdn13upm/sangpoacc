'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  bodyCellStyle,
  fieldWrapStyle,
  headerCellStyle,
  inputStyle,
  labelStyle,
  pageHeaderStyle,
  panelStyle,
  panelTitleStyle,
  primaryButtonStyle,
  sectionSubtitleStyle,
  sectionTitleStyle,
  summaryCardStyle,
  summaryGridStyle,
  tableWrapStyle,
  textareaStyle,
} from '../ui';

type SupplierOption = {
  id: string;
  name: string;
  contract_award_value: number | null;
};

type Milestone = {
  id: string;
  supplier_id: string;
  title: string;
  description: string | null;
  milestone_amount: number;
  approved_invoice_total: number;
  manual_paid_total: number;
  sort_order: number;
  status: string;
  Sangpo_Supplier?: SupplierOption | SupplierOption[] | null;
};

type VariationOrder = {
  id: string;
  supplier_id: string;
  milestone_id: string | null;
  vo_number: string;
  description: string | null;
  amount: number;
  status: string;
  Sangpo_Supplier?: { name: string } | { name: string }[] | null;
};

const emptyMilestoneForm = {
  supplier_id: '',
  title: '',
  description: '',
  milestone_amount: '',
  approved_invoice_total: '',
  manual_paid_total: '',
  sort_order: '0',
  status: 'draft',
};

const emptyVoForm = {
  supplier_id: '',
  milestone_id: '',
  vo_number: '',
  description: '',
  amount: '',
  status: 'draft',
};

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getSupplierName(value: Milestone['Sangpo_Supplier'] | VariationOrder['Sangpo_Supplier']) {
  if (!value) return '-';
  if (Array.isArray(value)) return value[0]?.name || '-';
  return value.name || '-';
}

export default function LegacyMilestonesPage() {
  const supabase = createClient();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [variationOrders, setVariationOrders] = useState<VariationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [savingVo, setSavingVo] = useState(false);
  const [error, setError] = useState('');
  const [milestoneForm, setMilestoneForm] = useState(emptyMilestoneForm);
  const [voForm, setVoForm] = useState(emptyVoForm);

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userRow } = await supabase
          .from('Sangpo_User')
          .select('role, company_id')
          .eq('id', user.id)
          .single();

        setUserRole(userRow?.role || null);
        if (!userRow?.company_id) return;

        const { data: supplierRows } = await supabase
          .from('Sangpo_Supplier')
          .select('id, name, contract_award_value')
          .eq('company_id', userRow.company_id)
          .order('name');

        setSuppliers((supplierRows || []) as SupplierOption[]);

        const [milestoneResponse, voResponse] = await Promise.all([
          fetch('/api/milestones'),
          fetch('/api/variation-orders'),
        ]);

        const milestoneResult = await milestoneResponse.json();
        const voResult = await voResponse.json();

        if (!milestoneResponse.ok) throw new Error(milestoneResult.error || 'Failed to load milestones');
        if (!voResponse.ok) throw new Error(voResult.error || 'Failed to load variation orders');

        setMilestones(milestoneResult.milestones || []);
        setVariationOrders(voResult.variationOrders || []);
      } catch (loadError: any) {
        setError(loadError.message || 'Failed to load milestones');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function reloadMilestones() {
    const [milestoneResponse, voResponse] = await Promise.all([
      fetch('/api/milestones'),
      fetch('/api/variation-orders'),
    ]);
    const milestoneResult = await milestoneResponse.json();
    const voResult = await voResponse.json();
    if (!milestoneResponse.ok) throw new Error(milestoneResult.error || 'Failed to load milestones');
    if (!voResponse.ok) throw new Error(voResult.error || 'Failed to load variation orders');
    setMilestones(milestoneResult.milestones || []);
    setVariationOrders(voResult.variationOrders || []);
  }

  async function handleMilestoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingMilestone(true);
    setError('');

    try {
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(milestoneForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save milestone');

      setMilestoneForm(emptyMilestoneForm);
      await reloadMilestones();
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save milestone');
    } finally {
      setSavingMilestone(false);
    }
  }

  async function handleVoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingVo(true);
    setError('');

    try {
      const response = await fetch('/api/variation-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save variation order');

      setVoForm(emptyVoForm);
      await reloadMilestones();
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save variation order');
    } finally {
      setSavingVo(false);
    }
  }

  const isAdmin = userRole === 'admin';
  const totalMilestones = useMemo(() => milestones.reduce((sum, item) => sum + Number(item.milestone_amount || 0), 0), [milestones]);
  const totalApproved = useMemo(() => milestones.reduce((sum, item) => sum + Number(item.approved_invoice_total || 0), 0), [milestones]);
  const totalVo = useMemo(() => variationOrders.reduce((sum, item) => sum + Number(item.amount || 0), 0), [variationOrders]);

  if (loading) {
    return <p style={{ color: '#6b7280' }}>Loading milestones...</p>;
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={sectionTitleStyle}>Milestones & VO</h1>
          <p style={sectionSubtitleStyle}>
            Track milestone amounts against the awarded contract and keep VO separate from the original award value.
          </p>
        </div>
      </div>

      <div style={{ ...summaryGridStyle, marginBottom: '1.5rem' }}>
        <Metric label="Milestone Total" value={formatCurrency(totalMilestones)} />
        <Metric label="Approved Invoice Total" value={formatCurrency(totalApproved)} />
        <Metric label="VO Total" value={formatCurrency(totalVo)} />
      </div>

      {error && <p style={{ color: '#dc2626', marginTop: 0 }}>{error}</p>}

      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <Panel title="Add Milestone">
            <form onSubmit={handleMilestoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <Field label="Supplier">
                <select value={milestoneForm.supplier_id} onChange={(e) => setMilestoneForm({ ...milestoneForm, supplier_id: e.target.value })} style={inputStyle}>
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Milestone Title">
                <input value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Milestone Amount">
                <input type="number" min="0" step="0.01" value={milestoneForm.milestone_amount} onChange={(e) => setMilestoneForm({ ...milestoneForm, milestone_amount: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Approved Invoice Total">
                <input type="number" min="0" step="0.01" value={milestoneForm.approved_invoice_total} onChange={(e) => setMilestoneForm({ ...milestoneForm, approved_invoice_total: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Manual Paid Total">
                <input type="number" min="0" step="0.01" value={milestoneForm.manual_paid_total} onChange={(e) => setMilestoneForm({ ...milestoneForm, manual_paid_total: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Description">
                <textarea rows={3} value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} style={textareaStyle} />
              </Field>
              <button type="submit" disabled={savingMilestone} style={primaryButtonStyle}>
                {savingMilestone ? 'Saving...' : 'Save Milestone'}
              </button>
            </form>
          </Panel>

          <Panel title="Add Variation Order">
            <form onSubmit={handleVoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <Field label="Supplier">
                <select value={voForm.supplier_id} onChange={(e) => setVoForm({ ...voForm, supplier_id: e.target.value })} style={inputStyle}>
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Related Milestone">
                <select value={voForm.milestone_id} onChange={(e) => setVoForm({ ...voForm, milestone_id: e.target.value })} style={inputStyle}>
                  <option value="">No milestone link</option>
                  {milestones
                    .filter((milestone) => !voForm.supplier_id || milestone.supplier_id === voForm.supplier_id)
                    .map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.title}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="VO Number">
                <input value={voForm.vo_number} onChange={(e) => setVoForm({ ...voForm, vo_number: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="VO Amount">
                <input type="number" min="0" step="0.01" value={voForm.amount} onChange={(e) => setVoForm({ ...voForm, amount: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Description">
                <textarea rows={3} value={voForm.description} onChange={(e) => setVoForm({ ...voForm, description: e.target.value })} style={textareaStyle} />
              </Field>
              <button type="submit" disabled={savingVo} style={primaryButtonStyle}>
                {savingVo ? 'Saving...' : 'Save VO'}
              </button>
            </form>
          </Panel>
        </div>
      )}

      <Panel title="Milestone Summary">
        <div style={tableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <HeaderCell>Supplier</HeaderCell>
                <HeaderCell>Milestone</HeaderCell>
                <HeaderCell>Milestone Amount</HeaderCell>
                <HeaderCell>Approved Invoice</HeaderCell>
                <HeaderCell>Manual Paid</HeaderCell>
                <HeaderCell>Balance</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {milestones.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                    No milestones yet.
                  </td>
                </tr>
              ) : (
                milestones.map((milestone) => {
                  const balance = Number(milestone.milestone_amount || 0) - Number(milestone.approved_invoice_total || 0);
                  return (
                    <tr key={milestone.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <BodyCell>{getSupplierName(milestone.Sangpo_Supplier)}</BodyCell>
                      <BodyCell>{milestone.title}</BodyCell>
                      <BodyCell>{formatCurrency(milestone.milestone_amount)}</BodyCell>
                      <BodyCell>{formatCurrency(milestone.approved_invoice_total)}</BodyCell>
                      <BodyCell>{formatCurrency(milestone.manual_paid_total)}</BodyCell>
                      <BodyCell>{formatCurrency(balance)}</BodyCell>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={{ height: '1rem' }} />

      <Panel title="Variation Orders">
        <div style={tableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <HeaderCell>Supplier</HeaderCell>
                <HeaderCell>VO Number</HeaderCell>
                <HeaderCell>Amount</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Description</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {variationOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                    No variation orders yet.
                  </td>
                </tr>
              ) : (
                variationOrders.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <BodyCell>{getSupplierName(item.Sangpo_Supplier)}</BodyCell>
                    <BodyCell>{item.vo_number}</BodyCell>
                    <BodyCell>{formatCurrency(item.amount)}</BodyCell>
                    <BodyCell>{item.status}</BodyCell>
                    <BodyCell>{item.description || '-'}</BodyCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={panelStyle}>
      <h2 style={panelTitleStyle}>{title}</h2>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryCardStyle}>
      <p style={{ color: '#6b7280', fontSize: '0.82rem', margin: 0, marginBottom: '0.35rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ color: '#111827', fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={fieldWrapStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function HeaderCell({ children }: { children: ReactNode }) {
  return <th style={headerCellStyle}>{children}</th>;
}

function BodyCell({ children }: { children: ReactNode }) {
  return <td style={bodyCellStyle}>{children}</td>;
}
