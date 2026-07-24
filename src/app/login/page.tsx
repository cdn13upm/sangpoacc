'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/ssr';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw authError;

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
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
      background: 'linear-gradient(135deg, #780000 0%, #2d0000 100%)',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem 2.5rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 10px 10px -5px rgb(0 0 0 / 0.2)',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <img
            src="https://i.imgur.com/3QwX7aL.png"
            alt="Sangpo Buddhist Society"
            style={{ width: '140px', height: '140px', marginBottom: '1rem' }}
          />
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '800',
            color: '#780000',
            marginBottom: '0.5rem'
          }}>
            SangpoAcc
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
            Account Tracking System
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
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
                borderRadius: '0.5rem',
                border: '2px solid #e5e7eb',
                padding: '0.875rem 1rem',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#780000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                display: 'block',
                width: '100%',
                borderRadius: '0.5rem',
                border: '2px solid #e5e7eb',
                padding: '0.875rem 1rem',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#780000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '0.5rem' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
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
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px -1px rgb(120 0 0 / 0.4)',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5a0000')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#780000')}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f3f4f6' }}>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              Don't have an account?
            </p>
            <Link
              href="/register"
              style={{
                color: '#780000',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '1rem',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#5a0000'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#780000'}
            >
              Register User
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
