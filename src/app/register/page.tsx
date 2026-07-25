'use client';

import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SECRET_CODE = 'S@ngpo9088';

type CompanyOption = {
  id: string;
  name: string;
};

export default function RegisterPage() {
  const [step, setStep] = useState<'code' | 'form'>('code');
  const [code, setCode] = useState('');
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    companyMode: 'existing' as 'existing' | 'new',
    existingCompanyId: '',
    companyName: '',
    role: 'admin' as 'admin' | 'manager' | 'company_director',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (step !== 'form') return;

    async function loadCompanies() {
      try {
        const response = await fetch('/api/register/companies');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to load companies');

        const rows = result.companies || [];
        setCompanies(rows);
        setFormData((current) => ({
          ...current,
          companyMode: rows.length > 0 ? current.companyMode : 'new',
          existingCompanyId: current.existingCompanyId || rows[0]?.id || '',
        }));
      } catch (err: any) {
        setError(err.message || 'Failed to load companies');
      }
    }

    loadCompanies();
  }, [step]);

  const handleCodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code === SECRET_CODE) {
      setStep('form');
      setError('');
    } else {
      setError('Invalid secret code!');
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const showExistingCompany = formData.companyMode === 'existing' && companies.length > 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #780000 0%, #2d0000 100%)',
        padding: '2rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '3rem 2.5rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 10px 10px -5px rgb(0 0 0 / 0.2)',
          width: '100%',
          maxWidth: '520px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <img
            src="/logo.png"
            alt="Sangpo Buddhist Society"
            style={{ width: '120px', height: '120px', marginBottom: '1rem' }}
          />
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: '800',
              color: '#780000',
              marginBottom: '0.5rem',
            }}
          >
            Register New User
          </h1>
        </div>

        {step === 'code' ? (
          <form onSubmit={handleCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Field label="Secret Code">
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={inputStyle}
              />
            </Field>

            {error && <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>{error}</p>}

            <button type="submit" style={buttonStyle}>
              Continue
            </button>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: 0 }}>
              <Link href="/login" style={{ color: '#780000', textDecoration: 'none', fontWeight: '700' }}>
                Already have an account? Login
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <Field label="Company Setup">
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {companies.length > 0 && (
                  <label style={radioLabelStyle}>
                    <input
                      type="radio"
                      checked={formData.companyMode === 'existing'}
                      onChange={() => setFormData({ ...formData, companyMode: 'existing' })}
                    />
                    Join existing company
                  </label>
                )}
                <label style={radioLabelStyle}>
                  <input
                    type="radio"
                    checked={formData.companyMode === 'new'}
                    onChange={() => setFormData({ ...formData, companyMode: 'new' })}
                  />
                  Create new company
                </label>

                {showExistingCompany ? (
                  <select
                    value={formData.existingCompanyId}
                    onChange={(e) => setFormData({ ...formData, existingCompanyId: e.target.value })}
                    style={inputStyle}
                  >
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required={!showExistingCompany}
                    placeholder="Enter new company name"
                    style={inputStyle}
                  />
                )}
              </div>
            </Field>

            <Field label="Username">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                required
                placeholder="example: sangpodirector"
                style={inputStyle}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                style={inputStyle}
              />
            </Field>

            <Field label="Role">
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' | 'company_director' })}
                style={inputStyle}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="company_director">Company Director</option>
              </select>
            </Field>

            {error && <p style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: 0 }}>{error}</p>}

            <button type="submit" disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ textAlign: 'left' }}>
      <label
        style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '0.5rem',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.875rem 1rem',
  border: '2px solid #e5e7eb',
  borderRadius: '0.5rem',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: 'white',
};

const buttonStyle: CSSProperties = {
  width: '100%',
  backgroundColor: '#780000',
  color: 'white',
  padding: '0.95rem 1.25rem',
  borderRadius: '0.5rem',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '700',
  letterSpacing: '0.025em',
  boxShadow: '0 4px 6px -1px rgb(120 0 0 / 0.4)',
};

const radioLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  color: '#374151',
  fontSize: '0.92rem',
};
