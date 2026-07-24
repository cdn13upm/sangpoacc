'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  secondaryButtonStyle,
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
  payment_date: string | null;
  payment_reference: string | null;
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
  payment_date: string | null;
  payment_reference: string | null;
  status: string;
  Sangpo_Supplier?: { name: string } | { name: string }[] | null;
};

type MilestoneFormState = {
  supplier_id: string;
  title: string;
  description: string;
  milestone_amount: string;
  approved_invoice_total: string;
  payment_date: string;
  payment_reference: string;
  sort_order: string;
  status: string;
};

type VoFormState = {
  supplier_id: string;
  milestone_id: string;
  vo_number: string;
  description: string;
  amount: string;
  payment_date: string;
  payment_reference: string;
  status: string;
};

const emptyMilestoneForm: MilestoneFormState = {
  supplier_id: '',
  title: '',
  description: '',
  milestone_amount: '',
  approved_invoice_total: '',
  payment_date: '',
  payment_reference: '',
  sort_order: '0',
  status: 'draft',
};

const emptyVoForm: VoFormState = {
  supplier_id: '',
  milestone_id: '',
  vo_number: '',
  description: '',
  amount: '',
  payment_date: '',
  payment_reference: '',
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

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
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
  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormState>(emptyMilestoneForm);
  const [voForm, setVoForm] = useState<VoFormState>(emptyVoForm);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editingVoId, setEditingVoId] = useState<string | null>(null);
  const milestonePanelRef = useRef<HTMLDivElement | null>(null);
  const voPanelRef = useRef<HTMLDivElement | null>(null);

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
        await reloadMilestones();
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

  function resetMilestoneForm() {
    setMilestoneForm(emptyMilestoneForm);
    setEditingMilestoneId(null);
  }

  function resetVoForm() {
    setVoForm(emptyVoForm);
    setEditingVoId(null);
  }

  function scrollToPanel(panel: HTMLDivElement | null) {
    if (!panel || typeof window === 'undefined') return;

    window.requestAnimationFrame(() => {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function startMilestoneEdit(milestone: Milestone) {
    setEditingMilestoneId(milestone.id);
    setEditingVoId(null);
    setMilestoneForm({
      supplier_id: milestone.supplier_id || '',
      title: milestone.title || '',
      description: milestone.description || '',
      milestone_amount: String(milestone.milestone_amount || 0),
      approved_invoice_total: String(milestone.approved_invoice_total || 0),
      payment_date: milestone.payment_date || '',
      payment_reference: milestone.payment_reference || '',
      sort_order: String(milestone.sort_order || 0),
      status: milestone.status || 'draft',
    });
    scrollToPanel(milestonePanelRef.current);
  }

  function startVoEdit(item: VariationOrder) {
    setEditingVoId(item.id);
    setEditingMilestoneId(null);
    setVoForm({
      supplier_id: item.supplier_id || '',
      milestone_id: item.milestone_id || '',
      vo_number: item.vo_number || '',
      description: item.description || '',
      amount: String(item.amount || 0),
      payment_date: item.payment_date || '',
      payment_reference: item.payment_reference || '',
      status: item.status || 'draft',
    });
    scrollToPanel(voPanelRef.current);
  }

  async function handleMilestoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingMilestone(true);
    setError('');

    try {
      const response = await fetch('/api/milestones', {
        method: editingMilestoneId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingMilestoneId ? { id: editingMilestoneId, ...milestoneForm } : milestoneForm
        ),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save milestone');

      resetMilestoneForm();
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
        method: editingVoId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingVoId ? { id: editingVoId, ...voForm } : voForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save variation order');

      resetVoForm();
      await reloadMilestones();
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save variation order');
    } finally {
      setSavingVo(false);
    }
  }

  async function handleMilestoneDelete(id: string) {
    if (!confirm('Delete this milestone?')) return;

    try {
      const response = await fetch('/api/milestones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete milestone');

      if (editingMilestoneId === id) {
        resetMilestoneForm();
      }
      await reloadMilestones();
    } catch (deleteError: any) {
      setError(deleteError.message || 'Failed to delete milestone');
    }
  }

  async function handleVoDelete(id: string) {
    if (!confirm('Delete this variation order?')) return;

    try {
      const response = await fetch('/api/variation-orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete variation order');

      if (editingVoId === id) {
        resetVoForm();
      }
      await reloadMilestones();
    } catch (deleteError: any) {
      setError(deleteError.message || 'Failed to delete variation order');
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
          <div
            ref={milestonePanelRef}
            style={editingMilestoneId ? { borderRadius: '1rem', boxShadow: '0 0 0 2px rgba(127, 29, 29, 0.16)' } : undefined}
          >
          <Panel title={editingMilestoneId ? 'Edit Milestone' : 'Add Milestone'}>
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
              <Field label="Payment Date">
                <input type="date" value={milestoneForm.payment_date} onChange={(e) => setMilestoneForm({ ...milestoneForm, payment_date: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Payment Reference">
                <input value={milestoneForm.payment_reference} onChange={(e) => setMilestoneForm({ ...milestoneForm, payment_reference: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Description">
                <textarea rows={3} value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} style={textareaStyle} />
              </Field>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="submit" disabled={savingMilestone} style={{ ...primaryButtonStyle, opacity: savingMilestone ? 0.7 : 1 }}>
                  {savingMilestone ? 'Saving...' : editingMilestoneId ? 'Update Milestone' : 'Save Milestone'}
                </button>
                {editingMilestoneId && (
                  <button type="button" onClick={resetMilestoneForm} style={secondaryButtonStyle}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </Panel>
          </div>

          <div
            ref={voPanelRef}
            style={editingVoId ? { borderRadius: '1rem', boxShadow: '0 0 0 2px rgba(127, 29, 29, 0.16)' } : undefined}
          >
          <Panel title={editingVoId ? 'Edit Variation Order' : 'Add Variation Order'}>
            <form onSubmit={handleVoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <Field label="Supplier">
                <select value={voForm.supplier_id} onChange={(e) => setVoForm({ ...voForm, supplier_id: e.target.value, milestone_id: '' })} style={inputStyle}>
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
              <Field label="Payment Date">
                <input type="date" value={voForm.payment_date} onChange={(e) => setVoForm({ ...voForm, payment_date: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Payment Reference">
                <input value={voForm.payment_reference} onChange={(e) => setVoForm({ ...voForm, payment_reference: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Description">
                <textarea rows={3} value={voForm.description} onChange={(e) => setVoForm({ ...voForm, description: e.target.value })} style={textareaStyle} />
              </Field>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="submit" disabled={savingVo} style={{ ...primaryButtonStyle, opacity: savingVo ? 0.7 : 1 }}>
                  {savingVo ? 'Saving...' : editingVoId ? 'Update VO' : 'Save VO'}
                </button>
                {editingVoId && (
                  <button type="button" onClick={resetVoForm} style={secondaryButtonStyle}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </Panel>
          </div>
        </div>
      )}

      <Panel title="Milestone Summary">
        <div style={tableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isAdmin ? '1040px' : '900px' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <HeaderCell>Supplier</HeaderCell>
                <HeaderCell>Milestone</HeaderCell>
                <HeaderCell>Milestone Amount</HeaderCell>
                <HeaderCell>Approved Invoice</HeaderCell>
                <HeaderCell>Payment Date</HeaderCell>
                <HeaderCell>Reference</HeaderCell>
                <HeaderCell>Balance</HeaderCell>
                {isAdmin && <HeaderCell>Actions</HeaderCell>}
              </tr>
            </thead>
            <tbody>
              {milestones.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>
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
                    <BodyCell>{formatDate(milestone.payment_date)}</BodyCell>
                    <BodyCell>{milestone.payment_reference || '-'}</BodyCell>
                      <BodyCell>{formatCurrency(balance)}</BodyCell>
                      {isAdmin && (
                        <BodyCell>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => startMilestoneEdit(milestone)} style={secondaryButtonStyle}>
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMilestoneDelete(milestone.id)}
                              style={{
                                ...secondaryButtonStyle,
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#b91c1c',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </BodyCell>
                      )}
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isAdmin ? '1020px' : '860px' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <HeaderCell>Supplier</HeaderCell>
                <HeaderCell>VO Number</HeaderCell>
                <HeaderCell>Amount</HeaderCell>
                <HeaderCell>Payment Date</HeaderCell>
                <HeaderCell>Reference</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Description</HeaderCell>
                {isAdmin && <HeaderCell>Actions</HeaderCell>}
              </tr>
            </thead>
            <tbody>
              {variationOrders.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                    No variation orders yet.
                  </td>
                </tr>
              ) : (
                variationOrders.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <BodyCell>{getSupplierName(item.Sangpo_Supplier)}</BodyCell>
                    <BodyCell>{item.vo_number}</BodyCell>
                    <BodyCell>{formatCurrency(item.amount)}</BodyCell>
                    <BodyCell>{formatDate(item.payment_date)}</BodyCell>
                    <BodyCell>{item.payment_reference || '-'}</BodyCell>
                    <BodyCell>{item.status}</BodyCell>
                    <BodyCell>{item.description || '-'}</BodyCell>
                    {isAdmin && (
                      <BodyCell>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => startVoEdit(item)} style={secondaryButtonStyle}>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVoDelete(item.id)}
                            style={{
                              ...secondaryButtonStyle,
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#b91c1c',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </BodyCell>
                    )}
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
