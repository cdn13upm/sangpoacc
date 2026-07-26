'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import LanguageToggle from '../language-toggle';
import { useLanguage } from '../language-provider';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const resolveResponse = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const resolveResult = await resolveResponse.json();

      if (!resolveResponse.ok) {
        throw new Error(resolveResult.error || 'Login failed');
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: resolveResult.email,
        password,
      });

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
      backgroundColor: '#ffffff',
      backgroundImage: `
        linear-gradient(135deg, rgba(120, 0, 0, 0.08) 0%, transparent 28%),
        linear-gradient(90deg, rgba(120, 0, 0, 0.08) 1px, transparent 1px),
        linear-gradient(rgba(120, 0, 0, 0.05) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 42px 42px, 42px 42px',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(120, 0, 0, 0.06) 0%, transparent 18%, transparent 82%, rgba(120, 0, 0, 0.08) 100%)'
      }} />
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '6px',
        background: 'linear-gradient(90deg, #780000 0%, #b91c1c 50%, #780000 100%)'
      }} />
      <div style={{
        backgroundColor: 'white',
        padding: '3rem 2.5rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.12), 0 10px 10px -5px rgb(0 0 0 / 0.08)',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        border: '1px solid rgba(120, 0, 0, 0.12)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '5px',
          borderTopLeftRadius: '1rem',
          borderTopRightRadius: '1rem',
          background: 'linear-gradient(90deg, #780000 0%, #d32f2f 55%, #780000 100%)'
        }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <LanguageToggle />
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <img
            src="/logo.png"
            alt="Sangpo Buddhist Society"
            style={{ width: '140px', height: '140px', marginBottom: '1rem' }}
          />
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '800',
            color: '#780000',
            marginBottom: '0.5rem'
          }}>
            {t('auth.login.title')}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
            {t('auth.login.subtitle')}
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
              {t('auth.login.identifier')}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder={t('auth.login.identifierPlaceholder')}
              style={{
                display: 'block',
                width: '100%',
                borderRadius: '0.5rem',
                border: '2px solid #e5e7eb',
                padding: '0.875rem 1rem',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease',
                outline: 'none',
                boxSizing: 'border-box'
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
              {t('auth.login.password')}
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
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#780000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '0.5rem' }}>{error}</p>}

          <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
            <Link
              href="/reset-password"
              style={{
                color: '#780000',
                textDecoration: 'none',
                fontSize: '0.92rem',
                fontWeight: '700',
              }}
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>

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
            {loading ? t('auth.login.signingIn') : t('auth.login.signIn')}
          </button>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f3f4f6' }}>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              {t('auth.login.noAccount')}
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
              {t('auth.login.register')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
