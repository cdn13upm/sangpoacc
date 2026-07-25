'use client';

import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
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
} from '../ui';

type CompanyRecord = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
};

type UserRecord = {
  id: string;
  company_id: string | null;
  company_name: string | null;
  role: 'admin' | 'manager';
  username: string | null;
  email: string | null;
};

type MappingDraft = {
  company_id: string;
  role: 'admin' | 'manager';
};

const emptyCompanyForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
};

export default function CompanyAdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [createForm, setCreateForm] = useState(emptyCompanyForm);
  const [mappingDrafts, setMappingDrafts] = useState<Record<string, MappingDraft>>({});
  const [savingCompany, setSavingCompany] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [savingMappingId, setSavingMappingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const selectedCompany = companies.find((company) => company.id === selectedCompanyId);
    if (!selectedCompany) return;

    setCompanyForm({
      name: selectedCompany.name || '',
      address: selectedCompany.address || '',
      phone: selectedCompany.phone || '',
      email: selectedCompany.email || '',
    });
  }, [selectedCompanyId, companies]);

  async function loadData() {
    try {
      setLoading(true);
      const response = await fetch('/api/company-admin');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to load company admin data');

      const companyRows = result.companies || [];
      const userRows = result.users || [];

      setCompanies(companyRows);
      setUsers(userRows);
      setCurrentCompanyId(result.currentCompanyId || '');
      setSelectedCompanyId(result.currentCompanyId || companyRows[0]?.id || '');
      setMappingDrafts(
        Object.fromEntries(
          userRows.map((user: UserRecord) => [
            user.id,
            {
              company_id: user.company_id || '',
              role: user.role,
            },
          ])
        )
      );
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load company admin data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompanySave(e: FormEvent) {
    e.preventDefault();
    setSavingCompany(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/company-admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'company',
          id: selectedCompanyId,
          ...companyForm,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save company');

      setNotice('Company profile updated.');
      await loadData();
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save company');
    } finally {
      setSavingCompany(false);
    }
  }

  async function handleCreateCompany(e: FormEvent) {
    e.preventDefault();
    setCreatingCompany(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/company-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create company');

      setCreateForm(emptyCompanyForm);
      setNotice('Company profile created.');
      await loadData();
      if (result.company?.id) {
        setSelectedCompanyId(result.company.id);
      }
    } catch (createError: any) {
      setError(createError.message || 'Failed to create company');
    } finally {
      setCreatingCompany(false);
    }
  }

  async function handleMappingSave(userId: string) {
    const draft = mappingDrafts[userId];
    if (!draft) return;

    setSavingMappingId(userId);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/company-admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mapping',
          userId,
          company_id: draft.company_id || null,
          role: draft.role,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update user mapping');

      setNotice('User company/role mapping updated.');
      await loadData();
    } catch (mappingError: any) {
      setError(mappingError.message || 'Failed to update user mapping');
    } finally {
      setSavingMappingId(null);
    }
  }

  const managerCount = useMemo(() => users.filter((user) => user.role === 'manager').length, [users]);
  const selectedCompanyName = companies.find((company) => company.id === selectedCompanyId)?.name || '-';

  if (loading) {
    return <p style={{ color: colors.muted }}>Loading company admin...</p>;
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={sectionTitleStyle}>Company Admin</h1>
          <p style={sectionSubtitleStyle}>
            Check company details, create company profiles, and map each user to the correct company and role from the UI.
          </p>
        </div>
      </div>

      <div style={{ ...summaryGridStyle, marginBottom: '1.5rem' }}>
        <MetricCard label="Companies" value={String(companies.length)} />
        <MetricCard label="Users" value={String(users.length)} />
        <MetricCard label="Managers" value={String(managerCount)} />
        <MetricCard label="Current Company" value={selectedCompanyName} />
      </div>

      {error && <p style={{ color: '#dc2626', marginTop: 0 }}>{error}</p>}
      {notice && <p style={{ color: colors.success, marginTop: 0 }}>{notice}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 0.9fr)', gap: '1rem', alignItems: 'start' }}>
        <div style={panelStyle}>
          <h2 style={panelTitleStyle}>Company Profile</h2>
          <form onSubmit={handleCompanySave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Company">
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                style={inputStyle}
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}{company.id === currentCompanyId ? ' (Current)' : ''}
                  </option>
                ))}
              </select>
            </Field>

            <div style={formGridStyle}>
              <Field label="Company Name">
                <input
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Company Email">
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Phone">
                <input
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Address">
                <input
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            </div>

            <div>
              <button type="submit" disabled={savingCompany || !selectedCompanyId} style={{ ...primaryButtonStyle, opacity: savingCompany ? 0.7 : 1 }}>
                {savingCompany ? 'Saving...' : 'Save Company Profile'}
              </button>
            </div>
          </form>
        </div>

        <div style={panelStyle}>
          <h2 style={panelTitleStyle}>Create Company</h2>
          <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Company Name">
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Company Email">
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Phone">
              <input
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Address">
              <input
                value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <div>
              <button type="submit" disabled={creatingCompany} style={{ ...primaryButtonStyle, opacity: creatingCompany ? 0.7 : 1 }}>
                {creatingCompany ? 'Creating...' : 'Create Company'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div style={{ height: '1rem' }} />

      <div style={panelStyle}>
        <h2 style={panelTitleStyle}>User Role Mapping</h2>
        <div style={tableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <HeaderCell>Email</HeaderCell>
                <HeaderCell>Username</HeaderCell>
                <HeaderCell>Current Company</HeaderCell>
                <HeaderCell>Role</HeaderCell>
                <HeaderCell>Map Company</HeaderCell>
                <HeaderCell>Map Role</HeaderCell>
                <HeaderCell>Actions</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem 1rem', textAlign: 'center', color: colors.muted }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const draft = mappingDrafts[user.id] || {
                    company_id: user.company_id || '',
                    role: user.role,
                  };

                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <BodyCell>{user.email || '-'}</BodyCell>
                      <BodyCell>{user.username || '-'}</BodyCell>
                      <BodyCell>{user.company_name || '-'}</BodyCell>
                      <BodyCell style={{ textTransform: 'capitalize' }}>{user.role}</BodyCell>
                      <BodyCell>
                        <select
                          value={draft.company_id}
                          onChange={(e) =>
                            setMappingDrafts((current) => ({
                              ...current,
                              [user.id]: {
                                ...draft,
                                company_id: e.target.value,
                              },
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="">No company</option>
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                      </BodyCell>
                      <BodyCell>
                        <select
                          value={draft.role}
                          onChange={(e) =>
                            setMappingDrafts((current) => ({
                              ...current,
                              [user.id]: {
                                ...draft,
                                role: e.target.value as 'admin' | 'manager',
                              },
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                        </select>
                      </BodyCell>
                      <BodyCell>
                        <button
                          type="button"
                          onClick={() => handleMappingSave(user.id)}
                          disabled={savingMappingId === user.id}
                          style={{ ...secondaryButtonStyle, opacity: savingMappingId === user.id ? 0.7 : 1 }}
                        >
                          {savingMappingId === user.id ? 'Saving...' : 'Save Mapping'}
                        </button>
                      </BodyCell>
                    </tr>
                  );
                })
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
      <p style={{ color: colors.ink, fontSize: '1.1rem', fontWeight: 800, margin: 0, wordBreak: 'break-word' }}>{value}</p>
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

function BodyCell({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <td style={{ ...bodyCellStyle, ...style }}>{children}</td>;
}
