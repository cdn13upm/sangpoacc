'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SECRET_CODE = 'S@ngpo9088';

export default function RegisterPage() {
  const [step, setStep] = useState<'code' | 'form'>('code');
  const [code, setCode] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    role: 'admin' as const
  });
  const [loading, setLoading] = useState(false);
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', formData);
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration successful!', data);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        {step === 'code' ? (
          <form onSubmit={handleCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h1 style={{ margin: 0, marginBottom: '1rem', textAlign: 'center' }}>Enter Secret Code</h1>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Secret Code</label>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              />
            </div>
            {error && <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
            <p style={{ textAlign: 'center', margin: 0 }}>
              <a href="/login" style={{ color: '#2563eb' }}>Already have an account? Login</a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h1 style={{ margin: 0, marginBottom: '1rem', textAlign: 'center' }}>Register New User</h1>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            {error && <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
