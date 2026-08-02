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
  created_at: string;
  Sangpo_Supplier?: { name: string } | { name: string }[] | null;
};

const emptyVoForm = {
  supplier_id: '',
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

function getSupplierName(value: VariationOrder['Sangpo_Supplier']) {
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

export default function VariationOrdersPage() {
  const supabase = createClient();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [variationOrders, setVariationOrders] = useState<VariationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(emptyVoForm);
  const [editingVoId, setEditingVoId] = useState<string | null>(null);
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
        if (activeProjectId) {
          supplierQuery = supplierQuery.eq('project_id', activeProjectId);
        }
        const { data: supplierRows } = await supplierQuery.order('name');

        setSuppliers((supplierRows || []) as SupplierOption[]);
        await reloadVariationOrders();
      } catch (loadError: any) {
        setError(loadError.message || 'Failed to load variation orders');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function reloadVariationOrders() {
    const response = await fetch('/api/variation-orders');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to load variation orders');
    setVariationOrders(result.variationOrders || []);
  }

  function resetForm() {
    setFormData(emptyVoForm);
    setEditingVoId(null);
  }

  function scrollToForm() {
    if (!formPanelRef.current || typeof window === 'undefined') return;

    window.requestAnimationFrame(() => {
      formPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function startEdit(item: VariationOrder) {
    setEditingVoId(item.id);
    setFormData({
      supplier_id: item.supplier_id || '',
      vo_number: item.vo_number || '',
      description: item.description || '',
      amount: String(item.amount || 0),
      payment_date: item.payment_date || '',
      payment_reference: item.payment_reference || '',
      status: item.status || 'draft',
    });
    scrollToForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/variation-orders', {
        method: editingVoId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingVoId ? { id: editingVoId, ...formData } : formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save variation order');

      resetForm();
      await reloadVariationOrders();
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save variation order');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
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
        resetForm();
      }
      await reloadVariationOrders();
    } catch (deleteError: any) {
      setError(deleteError.message || 'Failed to delete variation order');
    }
  }

  const isAdmin = userRole === 'admin';
  const totalVoAmount = useMemo(
    () => variationOrders.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [variationOrders]
  );
  const draftCount = useMemo(
    () => variationOrders.filter((item) => item.status === 'draft').length,
    [variationOrders]
  );
  const filteredVariationOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return variationOrders;

    return variationOrders.filter((item) =>
      getSupplierName(item.Sangpo_Supplier).toLowerCase().includes(normalizedSearch)
    );
  }, [variationOrders, searchTerm]);

  if (loading) {
    return <p style={{ color: colors.muted }}>Loading variation orders...</p>;
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={sectionTitleStyle}>Variation Orders</h1>
          <p style={sectionSubtitleStyle}>
            Separate VO key-in screen for admin use only. This page does not depend on milestone linkage.
          </p>
        </div>
      </div>

      <div style={{ ...summaryGridStyle, marginBottom: '1.5rem' }}>
        <MetricCard label="VO Records" value={String(variationOrders.length)} />
        <MetricCard label="Draft VO" value={String(draftCount)} />
        <MetricCard label="Total VO Amount" value={formatCurrency(totalVoAmount)} />
      </div>

      {error && <p style={{ color: '#dc2626', marginTop: 0 }}>{error}</p>}

      {isAdmin && (
        <div
          ref={formPanelRef}
          style={{
            ...panelStyle,
            marginBottom: '1.5rem',
            maxWidth: '960px',
            ...(editingVoId ? { boxShadow: '0 0 0 2px rgba(127, 29, 29, 0.16)' } : {}),
          }}
        >
          <h2 style={panelTitleStyle}>{editingVoId ? 'Edit Variation Order' : 'Add Variation Order'}</h2>
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
              <Field label="VO Number">
                <input
                  value={formData.vo_number}
                  onChange={(e) => setFormData({ ...formData, vo_number: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Amount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Payment Date">
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Payment Reference">
                <input
                  value={formData.payment_reference}
                  onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Status">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={inputStyle}
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
              </Field>
            </div>

            <Field label="Description">
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={textareaStyle}
              />
            </Field>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="submit" disabled={saving} style={{ ...primaryButtonStyle, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : editingVoId ? 'Update VO' : 'Save VO'}
              </button>
              {editingVoId && (
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
            Variation Orders can only be created by admin. You can still review the existing VO records below.
          </p>
        </div>
      )}

      <div style={panelStyle}>
        <h2 style={panelTitleStyle}>VO Register</h2>
        <div style={{ marginBottom: '1rem', maxWidth: '420px' }}>
          <Field label="Search Supplier">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type supplier name"
              style={inputStyle}
            />
          </Field>
        </div>
        <div style={tableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isAdmin ? '1100px' : '920px' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <HeaderCell>Supplier</HeaderCell>
                <HeaderCell>VO Number</HeaderCell>
                <HeaderCell>VO Amount</HeaderCell>
                <HeaderCell>Payment Date</HeaderCell>
                <HeaderCell>Reference</HeaderCell>
                <HeaderCell>Remark / Description</HeaderCell>
                {isAdmin && <HeaderCell>Actions</HeaderCell>}
              </tr>
            </thead>
            <tbody>
              {filteredVariationOrders.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} style={{ padding: '2rem 1rem', textAlign: 'center', color: colors.muted }}>
                    {variationOrders.length === 0 ? 'No variation orders yet.' : 'No VO records match that supplier name.'}
                  </td>
                </tr>
              ) : (
                filteredVariationOrders.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <BodyCell>{getSupplierName(item.Sangpo_Supplier)}</BodyCell>
                    <BodyCell>{item.vo_number}</BodyCell>
                    <BodyCell>{formatCurrency(item.amount)}</BodyCell>
                    <BodyCell>{formatDate(item.payment_date)}</BodyCell>
                    <BodyCell>{item.payment_reference || '-'}</BodyCell>
                    <BodyCell>{item.description || '-'}</BodyCell>
                    {isAdmin && (
                      <BodyCell>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => startEdit(item)} style={secondaryButtonStyle}>
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
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryCardStyle}>
      <p style={{ color: colors.muted, fontSize: '0.82rem', margin: 0, marginBottom: '0.35rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ color: colors.ink, fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{value}</p>
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
