'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  const [formData, setFormData] = useState(emptyVoForm);

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
          .select('id, name')
          .eq('company_id', userRow.company_id)
          .order('name');

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/variation-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save variation order');

      setFormData(emptyVoForm);
      await reloadVariationOrders();
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save variation order');
    } finally {
      setSaving(false);
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
        <div style={{ ...panelStyle, marginBottom: '1.5rem', maxWidth: '960px' }}>
          <h2 style={panelTitleStyle}>Add Variation Order</h2>
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

            <div>
              <button type="submit" disabled={saving} style={{ ...primaryButtonStyle, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save VO'}
              </button>
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
        <div style={tableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '980px' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <HeaderCell>VO Number</HeaderCell>
                <HeaderCell>Supplier</HeaderCell>
                <HeaderCell>Amount</HeaderCell>
                <HeaderCell>Payment Date</HeaderCell>
                <HeaderCell>Reference</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Created</HeaderCell>
                <HeaderCell>Description</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {variationOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem 1rem', textAlign: 'center', color: colors.muted }}>
                    No variation orders yet.
                  </td>
                </tr>
              ) : (
                variationOrders.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <BodyCell>{item.vo_number}</BodyCell>
                    <BodyCell>{getSupplierName(item.Sangpo_Supplier)}</BodyCell>
                    <BodyCell>{formatCurrency(item.amount)}</BodyCell>
                    <BodyCell>{formatDate(item.payment_date)}</BodyCell>
                    <BodyCell>{item.payment_reference || '-'}</BodyCell>
                    <BodyCell>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '0.28rem 0.62rem',
                          borderRadius: '999px',
                          backgroundColor: item.status === 'approved' ? '#ecfdf5' : '#fff7ed',
                          color: item.status === 'approved' ? '#15803d' : '#b45309',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                        }}
                      >
                        {item.status}
                      </span>
                    </BodyCell>
                    <BodyCell>{formatDate(item.created_at)}</BodyCell>
                    <BodyCell>{item.description || '-'}</BodyCell>
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
