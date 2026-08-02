'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getClientActiveProjectId } from '@/lib/projects';
import {
  bodyCellStyle,
  colors,
  fieldWrapStyle,
  formGridStyle,
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
};

type UnpaidInvoice = {
  id: string;
  supplier_id: string;
  invoice_number: string;
  invoice_date: string | null;
  due_date: string | null;
  invoice_amount: number;
  description: string | null;
  remark: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  Sangpo_Supplier?: { name: string } | { name: string }[] | null;
};

const approverRoles = ['admin', 'manager', 'company_director'];

const emptyForm = {
  supplier_id: '',
  invoice_number: '',
  invoice_date: '',
  due_date: '',
  invoice_amount: '',
  description: '',
  remark: '',
  status: 'pending_approval',
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

function formatStatus(value: string | null | undefined) {
  if (!value) return '-';
  const map: Record<string, string> = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid',
  };
  return map[value] || value;
}

function getSupplierName(value: UnpaidInvoice['Sangpo_Supplier']) {
  if (!value) return '-';
  if (Array.isArray(value)) return value[0]?.name || '-';
  return value.name || '-';
}

export default function UnpaidInvoicesPage() {
  const supabase = createClient();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formPanelRef = useRef<HTMLDivElement | null>(null);

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

        const activeProjectId = getClientActiveProjectId();
        let supplierQuery = supabase
          .from('Sangpo_Supplier')
          .select('id, name')
          .eq('company_id', userRow.company_id);
        if (activeProjectId) supplierQuery = supplierQuery.eq('project_id', activeProjectId);

        const { data: supplierRows } = await supplierQuery.order('name');

        setSuppliers((supplierRows || []) as SupplierOption[]);
        await reloadRecords();
      } catch (loadError: any) {
        setError(loadError.message || 'Failed to load unpaid invoices');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function reloadRecords() {
    const response = await fetch('/api/unpaid-invoices');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to load unpaid invoices');
    setUnpaidInvoices(result.unpaidInvoices || []);
  }

  function resetForm() {
    setFormData(emptyForm);
    setEditingId(null);
  }

  function scrollToForm() {
    if (!formPanelRef.current || typeof window === 'undefined') return;
    window.requestAnimationFrame(() => {
      formPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function startEdit(item: UnpaidInvoice) {
    setEditingId(item.id);
    setFormData({
      supplier_id: item.supplier_id || '',
      invoice_number: item.invoice_number || '',
      invoice_date: item.invoice_date || '',
      due_date: item.due_date || '',
      invoice_amount: String(item.invoice_amount || 0),
      description: item.description || '',
      remark: item.remark || '',
      status: item.status || 'pending_approval',
    });
    scrollToForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/unpaid-invoices', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save unpaid invoice');

      resetForm();
      await reloadRecords();
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save unpaid invoice');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this unpaid invoice?')) return;

    try {
      const response = await fetch('/api/unpaid-invoices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete unpaid invoice');

      if (editingId === id) {
        resetForm();
      }
      await reloadRecords();
    } catch (deleteError: any) {
      setError(deleteError.message || 'Failed to delete unpaid invoice');
    }
  }

  async function handleApprove(id: string) {
    if (!confirm('Approve this unpaid invoice?')) return;
    await updateStatus(id, 'approved');
  }

  async function handleReject(id: string) {
    if (!confirm('Reject this unpaid invoice?')) return;
    await updateStatus(id, 'rejected');
  }

  async function handleMarkPaid(id: string) {
    if (!confirm('Mark this unpaid invoice as paid?')) return;
    await updateStatus(id, 'paid');
  }

  async function updateStatus(id: string, status: string) {
    setError('');
    try {
      const response = await fetch('/api/unpaid-invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update invoice status');
      await reloadRecords();
    } catch (updateError: any) {
      setError(updateError.message || 'Failed to update invoice status');
    }
  }

  const isAdmin = userRole === 'admin';
  const isApprover = !!userRole && approverRoles.includes(userRole);

  const totalUnpaidAmount = useMemo(
    () =>
      unpaidInvoices
        .filter((item) => item.status !== 'paid')
        .reduce((sum, item) => sum + Number(item.invoice_amount || 0), 0),
    [unpaidInvoices]
  );
  const pendingCount = useMemo(
    () => unpaidInvoices.filter((item) => item.status === 'pending_approval').length,
    [unpaidInvoices]
  );
  const totalAmount = useMemo(
    () => unpaidInvoices.reduce((sum, item) => sum + Number(item.invoice_amount || 0), 0),
    [unpaidInvoices]
  );

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return unpaidInvoices;

    return unpaidInvoices.filter((item) => {
      const supplierName = getSupplierName(item.Sangpo_Supplier).toLowerCase();
      const invoiceNo = (item.invoice_number || '').toLowerCase();
      return (
        supplierName.includes(normalizedSearch) || invoiceNo.includes(normalizedSearch)
      );
    });
  }, [unpaidInvoices, searchTerm]);

  const showActionColumn = isAdmin || isApprover;

  if (loading) {
    return <p style={{ color: colors.muted }}>Loading unpaid invoices...</p>;
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={sectionTitleStyle}>Unpaid Invoices</h1>
          <p style={sectionSubtitleStyle}>
            Key in pending approval unpaid invoices and track approval / payment status by supplier.
          </p>
        </div>
      </div>

      <div style={{ ...summaryGridStyle, marginBottom: '1.5rem' }}>
        <MetricCard label="Invoices" value={String(unpaidInvoices.length)} />
        <MetricCard label="Pending Approval" value={String(pendingCount)} />
        <MetricCard label="Total Invoice Amount" value={formatCurrency(totalAmount)} />
        <MetricCard label="Outstanding Amount" value={formatCurrency(totalUnpaidAmount)} />
      </div>

      {error && <p style={{ color: '#dc2626', marginTop: 0 }}>{error}</p>}

      {isAdmin && (
        <div
          ref={formPanelRef}
          style={{
            ...panelStyle,
            marginBottom: '1.5rem',
            maxWidth: '960px',
            ...(editingId ? { boxShadow: '0 0 0 2px rgba(127, 29, 29, 0.16)' } : {}),
          }}
        >
          <h2 style={panelTitleStyle}>
            {editingId ? 'Edit Unpaid Invoice' : 'Add Unpaid Invoice'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={formGridStyle}>
              <Field label="Supplier">
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
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
              <Field label="Invoice Number">
                <input
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  style={inputStyle}
                  placeholder="INV-0001"
                />
              </Field>
              <Field label="Invoice Date">
                <input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Due Date">
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Invoice Amount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.invoice_amount}
                  onChange={(e) => setFormData({ ...formData, invoice_amount: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Status">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={inputStyle}
                >
                  <option value="pending_approval">Pending Approval</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="paid">Paid</option>
                </select>
              </Field>
            </div>

            <Field label="Description">
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={textareaStyle}
                placeholder="Invoice items / scope of work"
              />
            </Field>

            <Field label="Remark">
              <textarea
                rows={3}
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                style={textareaStyle}
                placeholder="Internal notes"
              />
            </Field>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={saving}
                style={{ ...primaryButtonStyle, opacity: saving ? 0.7 : 1 }}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                  ? 'Update Unpaid Invoice'
                  : 'Save Unpaid Invoice'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={secondaryButtonStyle}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {!isAdmin && (
        <div style={{ ...panelStyle, marginBottom: '1.5rem', maxWidth: '720px' }}>
          <h2 style={panelTitleStyle}>Admin-only key in</h2>
          <p style={{ margin: 0, color: colors.muted, lineHeight: 1.7 }}>
            Unpaid invoices can only be created by admin. You can still review and approve submitted records below if you have approval rights.
          </p>
        </div>
      )}

      <div style={panelStyle}>
        <h2 style={panelTitleStyle}>Unpaid Invoice Register</h2>
        <div style={{ marginBottom: '1rem', maxWidth: '420px' }}>
          <Field label="Search Supplier / Invoice No">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type supplier name or invoice number"
              style={inputStyle}
            />
          </Field>
        </div>
        <div style={tableWrapStyle}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: showActionColumn ? '1180px' : '1020px',
            }}
          >
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <HeaderCell>Supplier</HeaderCell>
                <HeaderCell>Invoice No</HeaderCell>
                <HeaderCell>Invoice Date</HeaderCell>
                <HeaderCell>Due Date</HeaderCell>
                <HeaderCell>Invoice Amount</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Description</HeaderCell>
                <HeaderCell>Remark</HeaderCell>
                {showActionColumn && <HeaderCell>Actions</HeaderCell>}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={showActionColumn ? 9 : 8}
                    style={{
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      color: colors.muted,
                    }}
                  >
                    {unpaidInvoices.length === 0
                      ? 'No unpaid invoices yet.'
                      : 'No records match that search.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <BodyCell>{getSupplierName(item.Sangpo_Supplier)}</BodyCell>
                    <BodyCell>{item.invoice_number}</BodyCell>
                    <BodyCell>{formatDate(item.invoice_date)}</BodyCell>
                    <BodyCell>{formatDate(item.due_date)}</BodyCell>
                    <BodyCell>{formatCurrency(item.invoice_amount)}</BodyCell>
                    <BodyCell>
                      <StatusBadge status={item.status}>{formatStatus(item.status)}</StatusBadge>
                    </BodyCell>
                    <BodyCell>{item.description || '-'}</BodyCell>
                    <BodyCell>{item.remark || '-'}</BodyCell>
                    {showActionColumn && (
                      <BodyCell>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {isApprover && item.status === 'pending_approval' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(item.id)}
                                style={{
                                  ...secondaryButtonStyle,
                                  backgroundColor: '#ecfdf5',
                                  border: '1px solid #a7f3d0',
                                  color: '#065f46',
                                  padding: '0.45rem 0.8rem',
                                  fontSize: '0.85rem',
                                }}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(item.id)}
                                style={{
                                  ...secondaryButtonStyle,
                                  backgroundColor: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  color: '#991b1b',
                                  padding: '0.45rem 0.8rem',
                                  fontSize: '0.85rem',
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {item.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(item.id)}
                              style={{
                                ...secondaryButtonStyle,
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                padding: '0.45rem 0.8rem',
                                fontSize: '0.85rem',
                              }}
                            >
                              Mark Paid
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(item)}
                                style={{
                                  ...secondaryButtonStyle,
                                  padding: '0.45rem 0.8rem',
                                  fontSize: '0.85rem',
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                style={{
                                  ...secondaryButtonStyle,
                                  backgroundColor: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  color: '#b91c1c',
                                  padding: '0.45rem 0.8rem',
                                  fontSize: '0.85rem',
                                }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </BodyCell>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  children,
}: {
  status: string | null | undefined;
  children: ReactNode;
}) {
  const styles: Record<string, React.CSSProperties> = {
    draft: {
      backgroundColor: '#f3f4f6',
      border: '1px solid #d1d5db',
      color: '#374151',
    },
    pending_approval: {
      backgroundColor: '#fffbeb',
      border: '1px solid #fde68a',
      color: '#92400e',
    },
    approved: {
      backgroundColor: '#ecfdf5',
      border: '1px solid #a7f3d0',
      color: '#065f46',
    },
    rejected: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
    },
    paid: {
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      color: '#1d4ed8',
    },
  };
  const style = (status && styles[status]) || styles.draft;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.65rem',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 700,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
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
      <p style={{ color: colors.ink, fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
        {value}
      </p>
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
