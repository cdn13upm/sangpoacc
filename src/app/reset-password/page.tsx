'use client';

import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SECRET_CODE = 'S@ngpo9088';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'code' | 'form'>('code');
  const [code, setCode] = useState('');
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    if (code === SECRET_CODE) {
      setStep('form');
      setError('');
      setSuccess('');
      return;
    }

    setError('Invalid secret code!');
  }

  async function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
          secretCode: code,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      setSuccess('Password updated successfully. Redirecting to login...');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        backgroundImage: `
          linear-gradient(135deg, rgba(120, 0, 0, 0.08) 0%, transparent 28%),
          linear-gradient(90deg, rgba(120, 0, 0, 0.08) 1px, transparent 1px),
          linear-gradient(rgba(120, 0, 0, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 42px 42px, 42px 42px',
        padding: '2rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '3rem 2.5rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.12), 0 10px 10px -5px rgb(0 0 0 / 0.08)',
          width: '100%',
          maxWidth: '460px',
          textAlign: 'center',
          border: '1px solid rgba(120, 0, 0, 0.12)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '5px',
            borderTopLeftRadius: '1rem',
            borderTopRightRadius: '1rem',
            background: 'linear-gradient(90deg, #780000 0%, #d32f2f 55%, #780000 100%)',
          }}
        />

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
            Reset Password
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
            Internal access only. Use the secret code before resetting a password.
          </p>
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

            {error && <p style={{ color: '#dc2626', fontSize: '0.9rem', margin: 0 }}>{error}</p>}

            <button type="submit" style={buttonStyle}>
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <Field label="Email or Username">
              <input
                type="text"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                required
                placeholder="Enter email or username"
                style={inputStyle}
              />
            </Field>

            <Field label="New Password">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                style={inputStyle}
              />
            </Field>

            <Field label="Confirm New Password">
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
                style={inputStyle}
              />
            </Field>

            {error && <p style={{ color: '#dc2626', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
            {success && <p style={{ color: '#15803d', fontSize: '0.9rem', margin: 0 }}>{success}</p>}

            <button type="submit" disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: 0 }}>
          <Link href="/login" style={{ color: '#780000', textDecoration: 'none', fontWeight: '700' }}>
            Back to Login
          </Link>
        </p>
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
  display: 'block',
  width: '100%',
  borderRadius: '0.5rem',
  border: '2px solid #e5e7eb',
  padding: '0.875rem 1rem',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
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
