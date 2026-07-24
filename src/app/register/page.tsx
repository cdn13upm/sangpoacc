'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SECRET_CODE = 'S@ngpo9088';

export default function RegisterPage() {
  const [step, setStep] = useState<'code' | 'form'>('code');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === SECRET_CODE) {
      setStep('form');
      setError('');
    } else {
      setError('Invalid secret code!');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        width: '100%',
        maxWidth: '28rem'
      }}>
        {step === 'code' ? (
          <form onSubmit={handleCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
              Enter Secret Code
            </h1>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                Secret Code
              </label>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{
                  display: 'block',
                  width: '100%',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  padding: '0.5rem 0.75rem'
                }}
              />
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}
            <button
              type="submit"
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              <a href="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>
                Already have an account? Login
              </a>
            </p>
          </form>
        ) : (
          <RegisterForm onSuccess={() => router.push('/dashboard')} />
        )}
      </div>
    </div>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'admin' | 'manager'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('Form submit event triggered!');
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Submitting registration form:', { email, password, companyName, role });

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyName, role })
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const data = await res.json();
        console.error('Error response:', data);
        throw new Error(data.error || 'Registration failed');
      }

      const data = await res.json();
      console.log('Success response:', data);
      onSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
        Register New User
      </h1>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
          Company Name
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          style={{
            display: 'block',
            width: '100%',
            borderRadius: '0.375rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem'
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            display: 'block',
            width: '100%',
            borderRadius: '0.375rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem'
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{
            display: 'block',
            width: '100%',
            borderRadius: '0.375rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem'
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'manager')}
          style={{
            display: 'block',
            width: '100%',
            borderRadius: '0.375rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem'
          }}
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
        </select>
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        onClick={() => console.log('Register button clicked!')}
        style={{
          width: '100%',
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          border: 'none',
          cursor: 'pointer',
          opacity: loading ? 0.5 : 1
        }}
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
