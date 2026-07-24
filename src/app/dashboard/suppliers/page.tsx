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
  primaryButtonStyle,
  sectionSubtitleStyle,
  sectionTitleStyle,
  secondaryButtonStyle,
  summaryCardStyle,
  summaryGridStyle,
  tablePanelStyle,
  tableWrapStyle,
  textareaStyle,
} from '../ui';

type Supplier = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  contract_reference: string | null;
  contract_award_value: number | null;
  contract_award_date: string | null;
  scope_of_work: string | null;
  remark: string | null;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  contract_reference: string;
  contract_award_value: string;
  contract_award_date: string;
  scope_of_work: string;
  remark: string;
};

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  tax_id: '',
  contract_reference: '',
  contract_award_value: '',
  contract_award_date: '',
  scope_of_work: '',
  remark: '',
};

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function SuppliersPage() {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<FormState>(emptyForm);

  useEffect(() => {
    async function init() {
      await Promise.all([fetchUserRole(), fetchSuppliers()]);
    }

    init();
  }, []);

  async function fetchUserRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('Sangpo_User').select('role').eq('id', user.id).single();
    setUserRole(data?.role || null);
  }

  async function fetchSuppliers() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sangpoUser } = await supabase
        .from('Sangpo_User')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!sangpoUser?.company_id) return;

      const { data } = await supabase
        .from('Sangpo_Supplier')
        .select('*')
        .eq('company_id', sangpoUser.company_id)
        .order('created_at', { ascending: false });

      setSuppliers((data || []) as Supplier[]);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData(emptyForm);
    setEditingSupplier(null);
    setFormError('');
    setShowModal(false);
  }

  function openCreateModal() {
    setFormData(emptyForm);
    setEditingSupplier(null);
    setFormError('');
    setShowModal(true);
  }

  function handleEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setFormError('');
    setFormData({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      tax_id: supplier.tax_id || '',
      contract_reference: supplier.contract_reference || '',
      contract_award_value: supplier.contract_award_value?.toString() || '',
      contract_award_date: supplier.contract_award_date || '',
      scope_of_work: supplier.scope_of_work || '',
      remark: supplier.remark || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      const payload = {
        ...formData,
        contract_award_value: formData.contract_award_value || '0',
      };

      const response = editingSupplier
        ? await fetch('/api/suppliers', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingSupplier.id, ...payload }),
          })
        : await fetch('/api/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save supplier');
      }

      resetForm();
      await fetchSuppliers();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      setFormError(error.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      const response = await fetch('/api/suppliers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete supplier');
      }

      await fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  }

  const isAdmin = userRole === 'admin';
  const totalAwarded = useMemo(
    () => suppliers.reduce((sum, supplier) => sum + Number(supplier.contract_award_value || 0), 0),
    [suppliers]
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={sectionTitleStyle}>Suppliers</h1>
          <p style={sectionSubtitleStyle}>Manage supplier details, awarded contract, scope of work, and remarks.</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            style={{
              ...primaryButtonStyle,
              whiteSpace: 'nowrap',
            }}
          >
            Add Supplier
          </button>
        )}
      </div>

      <div style={{ ...summaryGridStyle, marginBottom: '1.5rem' }}>
        <SummaryCard label="Total Suppliers" value={String(suppliers.length)} />
        <SummaryCard label="Total Awarded Contract" value={formatCurrency(totalAwarded)} />
      </div>

      <div style={tablePanelStyle}>
        <div style={tableWrapStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <HeaderCell>Name</HeaderCell>
              <HeaderCell>Contract Ref</HeaderCell>
              <HeaderCell>Award Value</HeaderCell>
              <HeaderCell>Scope of Work</HeaderCell>
              <HeaderCell>Remark</HeaderCell>
              {isAdmin && <HeaderCell>Actions</HeaderCell>}
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>
                  No suppliers yet. Add your first awarded contractor.
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id} style={{ borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                  <BodyCell>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{supplier.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.35rem' }}>{supplier.email || '-'}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{supplier.phone || '-'}</div>
                  </BodyCell>
                  <BodyCell>{supplier.contract_reference || '-'}</BodyCell>
                  <BodyCell>{formatCurrency(supplier.contract_award_value)}</BodyCell>
                  <BodyCell>{supplier.scope_of_work || '-'}</BodyCell>
                  <BodyCell>{supplier.remark || '-'}</BodyCell>
                  {isAdmin && (
                    <BodyCell>
                      <button
                        onClick={() => handleEdit(supplier)}
                        style={{
                          backgroundColor: '#f3f4f6',
                          color: '#111827',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          marginRight: '0.5rem',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                        }}
                      >
                        Delete
                      </button>
                    </BodyCell>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div style={{ ...panelStyle, width: '100%', maxWidth: '840px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(120,0,0,0.08)', maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto', padding: 0 }}>
            <div style={{ padding: '1.6rem 1.75rem 1rem', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(180deg, #fff7f7 0%, #ffffff 100%)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827', marginBottom: '0.35rem', marginTop: 0 }}>
              {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
              Fill in supplier details, awarded contract, and work scope.
            </p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem 1.75rem 1.75rem' }}>
              <div style={formGridStyle}>
                <FormField label="Supplier Name">
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={inputStyle} />
                </FormField>
                <FormField label="Contract Reference">
                  <input value={formData.contract_reference} onChange={(e) => setFormData({ ...formData, contract_reference: e.target.value })} style={inputStyle} />
                </FormField>
                <FormField label="Email">
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
                </FormField>
                <FormField label="Phone">
                  <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
                </FormField>
                <FormField label="Tax ID">
                  <input value={formData.tax_id} onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })} style={inputStyle} />
                </FormField>
                <FormField label="Award Contract Value">
                  <input type="number" min="0" step="0.01" value={formData.contract_award_value} onChange={(e) => setFormData({ ...formData, contract_award_value: e.target.value })} style={inputStyle} />
                </FormField>
                <FormField label="Award Date">
                  <input type="date" value={formData.contract_award_date} onChange={(e) => setFormData({ ...formData, contract_award_date: e.target.value })} style={inputStyle} />
                </FormField>
                <FormField label="Address">
                  <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={inputStyle} />
                </FormField>
              </div>
              <FormField label="Scope of Work">
                <textarea rows={4} value={formData.scope_of_work} onChange={(e) => setFormData({ ...formData, scope_of_work: e.target.value })} style={textareaStyle} />
              </FormField>
              <FormField label="Remark">
                <textarea rows={3} value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} style={textareaStyle} />
              </FormField>
              {formError && <p style={{ color: '#dc2626', fontSize: '0.9rem', margin: 0 }}>{formError}</p>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.25rem', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" onClick={resetForm} style={secondaryButtonStyle}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ ...primaryButtonStyle, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryCardStyle}>
      <p style={{ color: colors.muted, fontSize: '0.82rem', margin: 0, marginBottom: '0.35rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ color: colors.ink, fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{value}</p>
    </div>
  );
}

function HeaderCell({ children }: { children: ReactNode }) {
  return <th style={headerCellStyle}>{children}</th>;
}

function BodyCell({ children }: { children: ReactNode }) {
  return <td style={bodyCellStyle}>{children}</td>;
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={fieldWrapStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
