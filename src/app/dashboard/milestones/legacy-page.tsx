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

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function getSupplierName(value: Milestone['Sangpo_Supplier']) {
  if (!value) return '-';
  if (Array.isArray(value)) return value[0]?.name || '-';
  return value.name || '-';
}

export default function LegacyMilestonesPage() {
  const supabase = createClient();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [error, setError] = useState('');
  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormState>(emptyMilestoneForm);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const milestonePanelRef = useRef<HTMLDivElement | null>(null);

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
    const milestoneResponse = await fetch('/api/milestones');
    const milestoneResult = await milestoneResponse.json();

    if (!milestoneResponse.ok) {
      throw new Error(milestoneResult.error || 'Failed to load milestones');
    }

    setMilestones(milestoneResult.milestones || []);
  }

  function resetMilestoneForm() {
    setMilestoneForm(emptyMilestoneForm);
    setEditingMilestoneId(null);
  }

  function scrollToPanel(panel: HTMLDivElement | null) {
    if (!panel || typeof window === 'undefined') return;

    window.requestAnimationFrame(() => {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function startMilestoneEdit(milestone: Milestone) {
    setEditingMilestoneId(milestone.id);
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

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save milestone');
      }

      resetMilestoneForm();
      await reloadMilestones();
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save milestone');
    } finally {
      setSavingMilestone(false);
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

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete milestone');
      }

      if (editingMilestoneId === id) {
        resetMilestoneForm();
      }

      await reloadMilestones();
    } catch (deleteError: any) {
      setError(deleteError.message || 'Failed to delete milestone');
    }
  }

  const isAdmin = userRole === 'admin';
  const totalMilestones = useMemo(
    () => milestones.reduce((sum, item) => sum + Number(item.milestone_amount || 0), 0),
    [milestones]
  );
  const totalApproved = useMemo(
    () => milestones.reduce((sum, item) => sum + Number(item.approved_invoice_total || 0), 0),
    [milestones]
  );
  const totalBalance = useMemo(
    () =>
      milestones.reduce(
        (sum, item) => sum + (Number(item.milestone_amount || 0) - Number(item.approved_invoice_total || 0)),
        0
      ),
    [milestones]
  );

  if (loading) {
    return <p style={{ color: '#6b7280' }}>Loading milestones...</p>;
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={sectionTitleStyle}>Milestones</h1>
          <p style={sectionSubtitleStyle}>
            Track milestone amounts against awarded contracts, approved invoice totals, payment details, and current balance.
          </p>
        </div>
      </div>

      <div style={{ ...summaryGridStyle, marginBottom: '1.5rem' }}>
        <Metric label="Milestone Total" value={formatCurrency(totalMilestones)} />
        <Metric label="Approved Invoice Total" value={formatCurrency(totalApproved)} />
        <Metric label="Remaining Balance" value={formatCurrency(totalBalance)} />
      </div>

      {error && <p style={{ color: '#dc2626', marginTop: 0 }}>{error}</p>}

      {isAdmin && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            ref={milestonePanelRef}
            style={editingMilestoneId ? { borderRadius: '1rem', boxShadow: '0 0 0 2px rgba(127, 29, 29, 0.16)' } : undefined}
          >
            <Panel title={editingMilestoneId ? 'Edit Milestone' : 'Add Milestone'}>
              <form onSubmit={handleMilestoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <Field label="Supplier">
                  <select
                    value={milestoneForm.supplier_id}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, supplier_id: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Milestone Title">
                  <input
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Milestone Amount">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={milestoneForm.milestone_amount}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, milestone_amount: e.target.value })}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Approved Invoice Total">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={milestoneForm.approved_invoice_total}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, approved_invoice_total: e.target.value })}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Payment Date">
                  <input
                    type="date"
                    value={milestoneForm.payment_date}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, payment_date: e.target.value })}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Payment Reference">
                  <input
                    value={milestoneForm.payment_reference}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, payment_reference: e.target.value })}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    rows={3}
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                    style={textareaStyle}
                  />
                </Field>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    disabled={savingMilestone}
                    style={{ ...primaryButtonStyle, opacity: savingMilestone ? 0.7 : 1 }}
                  >
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
                  <td
                    colSpan={isAdmin ? 8 : 7}
                    style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}
                  >
                    No milestones yet.
                  </td>
                </tr>
              ) : (
                milestones.map((milestone) => {
                  const balance =
                    Number(milestone.milestone_amount || 0) - Number(milestone.approved_invoice_total || 0);

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
                            <button
                              type="button"
                              onClick={() => startMilestoneEdit(milestone)}
                              style={secondaryButtonStyle}
                            >
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
      <p
        style={{
          color: '#6b7280',
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
