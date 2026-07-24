'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Supplier = {
  id: string;
  name: string;
};

type Milestone = {
  id: string;
  title: string;
  supplier_id: string;
};

type Certificate = {
  id: string;
  certificate_number: string;
  certificate_date: string;
  invoice_number: string | null;
  invoice_amount: number;
  certified_amount: number;
  approval_status: string;
  approval_remark: string | null;
  supplier_id: string | null;
  milestone_id: string | null;
  Sangpo_Supplier?: Supplier | Supplier[] | null;
  Sangpo_Milestone?: { title: string } | { title: string }[] | null;
};

const emptyForm = {
  supplier_id: '',
  milestone_id: '',
  certificate_number: '',
  certificate_date: '',
  invoice_number: '',
  invoice_amount: '',
  certified_amount: '',
  approval_status: 'draft',
  approval_remark: '',
};

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getJoinedName(value: Certificate['Sangpo_Supplier'] | Certificate['Sangpo_Milestone']) {
  if (!value) return '-';
  if (Array.isArray(value)) return value[0]?.name || value[0]?.title || '-';
  return value.name || value.title || '-';
}

export default function CertificatesPage() {
  const supabase = createClient();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(emptyForm);

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

        const [supplierRows, milestoneRows, certificateResponse] = await Promise.all([
          supabase.from('Sangpo_Supplier').select('id, name').eq('company_id', userRow.company_id).order('name'),
          supabase.from('Sangpo_Milestone').select('id, title, supplier_id').eq('company_id', userRow.company_id).order('sort_order'),
          fetch('/api/certificates'),
        ]);

        const certificateResult = await certificateResponse.json();
        if (!certificateResponse.ok) throw new Error(certificateResult.error || 'Failed to load certificates');

        setSuppliers((supplierRows.data || []) as Supplier[]);
        setMilestones((milestoneRows.data || []) as Milestone[]);
        setCertificates(certificateResult.certificates || []);
      } catch (loadError: any) {
        setError(loadError.message || 'Failed to load certificates');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function reloadCertificates() {
    const response = await fetch('/api/certificates');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to load certificates');
    setCertificates(result.certificates || []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create certificate');

      setFormData(emptyForm);
      await reloadCertificates();
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to create certificate');
    } finally {
      setSaving(false);
    }
  }

  async function submitToManager(id: string) {
    try {
      const response = await fetch('/api/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approval_status: 'pending_approval' }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit certificate');

      await reloadCertificates();
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to submit certificate');
    }
  }

  async function approveCertificate(id: string) {
    try {
      const response = await fetch('/api/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approval_status: 'approved' }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to approve certificate');

      await reloadCertificates();
    } catch (approveError: any) {
      setError(approveError.message || 'Failed to approve certificate');
    }
  }

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const totalCertified = useMemo(() => certificates.reduce((sum, item) => sum + Number(item.certified_amount || 0), 0), [certificates]);

  if (loading) {
    return <p style={{ color: '#6b7280' }}>Loading certificates...</p>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.35rem' }}>Certificates</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Admin prepares certificates after confirming invoice amounts. Manager can approve once the certificate is submitted.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Metric label="Certificates" value={String(certificates.length)} />
        <Metric label="Total Certified" value={formatCurrency(totalCertified)} />
      </div>

      {error && <p style={{ color: '#dc2626', marginTop: 0 }}>{error}</p>}

      {isAdmin && (
        <Panel title="Create Certificate">
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
            <Field label="Supplier">
              <select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value, milestone_id: '' })} style={inputStyle}>
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Milestone">
              <select value={formData.milestone_id} onChange={(e) => setFormData({ ...formData, milestone_id: e.target.value })} style={inputStyle}>
                <option value="">Optional milestone</option>
                {milestones
                  .filter((item) => !formData.supplier_id || item.supplier_id === formData.supplier_id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Certificate Number">
              <input value={formData.certificate_number} onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Certificate Date">
              <input type="date" value={formData.certificate_date} onChange={(e) => setFormData({ ...formData, certificate_date: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Invoice Number">
              <input value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Invoice Amount">
              <input type="number" min="0" step="0.01" value={formData.invoice_amount} onChange={(e) => setFormData({ ...formData, invoice_amount: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Certified Amount">
              <input type="number" min="0" step="0.01" value={formData.certified_amount} onChange={(e) => setFormData({ ...formData, certified_amount: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Initial Status">
              <select value={formData.approval_status} onChange={(e) => setFormData({ ...formData, approval_status: e.target.value })} style={inputStyle}>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
              </select>
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Remark">
                <textarea rows={3} value={formData.approval_remark} onChange={(e) => setFormData({ ...formData, approval_remark: e.target.value })} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </Field>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" disabled={saving} style={primaryButtonStyle}>
                {saving ? 'Saving...' : 'Create Certificate'}
              </button>
            </div>
          </form>
        </Panel>
      )}

      <div style={{ height: '1rem' }} />

      <Panel title="Certificate Workflow">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <HeaderCell>Certificate</HeaderCell>
              <HeaderCell>Supplier</HeaderCell>
              <HeaderCell>Milestone</HeaderCell>
              <HeaderCell>Invoice</HeaderCell>
              <HeaderCell>Certified Amount</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Actions</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {certificates.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                  No certificates yet.
                </td>
              </tr>
            ) : (
              certificates.map((certificate) => (
                <tr key={certificate.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <BodyCell>
                    <div style={{ fontWeight: 600 }}>{certificate.certificate_number}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{certificate.certificate_date}</div>
                  </BodyCell>
                  <BodyCell>{getJoinedName(certificate.Sangpo_Supplier)}</BodyCell>
                  <BodyCell>{getJoinedName(certificate.Sangpo_Milestone)}</BodyCell>
                  <BodyCell>
                    <div>{certificate.invoice_number || '-'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{formatCurrency(certificate.invoice_amount)}</div>
                  </BodyCell>
                  <BodyCell>{formatCurrency(certificate.certified_amount)}</BodyCell>
                  <BodyCell>{certificate.approval_status}</BodyCell>
                  <BodyCell>
                    {isAdmin && certificate.approval_status === 'draft' && (
                      <button onClick={() => submitToManager(certificate.id)} style={secondaryButtonStyle}>
                        Submit
                      </button>
                    )}
                    {isManager && certificate.approval_status === 'pending_approval' && (
                      <button onClick={() => approveCertificate(certificate.id)} style={primaryButtonStyle}>
                        Approve
                      </button>
                    )}
                  </BodyCell>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)', border: '1px solid rgba(0,0,0,0.05)' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', marginTop: 0, marginBottom: '1rem' }}>{title}</h2>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)', border: '1px solid rgba(0,0,0,0.05)' }}>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0, marginBottom: '0.4rem' }}>{label}</p>
      <p style={{ color: '#111827', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>{label}</label>
      {children}
    </div>
  );
}

function HeaderCell({ children }: { children: ReactNode }) {
  return (
    <th style={{ padding: '0.85rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#374151', fontWeight: 700, fontSize: '0.9rem' }}>
      {children}
    </th>
  );
}

function BodyCell({ children }: { children: ReactNode }) {
  return <td style={{ padding: '0.85rem 1rem', color: '#4b5563' }}>{children}</td>;
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  border: '2px solid #e5e7eb',
  borderRadius: '0.5rem',
  fontSize: '0.95rem',
  outline: 'none',
};

const primaryButtonStyle: CSSProperties = {
  backgroundColor: '#780000',
  color: 'white',
  padding: '0.65rem 1.1rem',
  borderRadius: '0.5rem',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '600',
};

const secondaryButtonStyle: CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#111827',
  padding: '0.65rem 1.1rem',
  borderRadius: '0.5rem',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '600',
};
