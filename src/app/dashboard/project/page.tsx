'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ProjectRecord = {
  id: string;
  name: string;
  overall_budget: number;
  notes: string | null;
};

export default function ProjectPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: 'Sangpo Temple Renovation Account',
    overall_budget: '0',
    notes: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userRow } = await supabase.from('Sangpo_User').select('role').eq('id', user.id).single();
        setUserRole(userRow?.role || null);

        const response = await fetch('/api/project');
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to load project');
        }

        setProject(result.project);
        if (result.project) {
          setFormData({
            name: result.project.name || 'Sangpo Temple Renovation Account',
            overall_budget: String(result.project.overall_budget || 0),
            notes: result.project.notes || '',
          });
        }
      } catch (loadError: any) {
        setError(loadError.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/project', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save project settings');
      }

      setProject(result.project);
      setFormData({
        name: result.project.name || '',
        overall_budget: String(result.project.overall_budget || 0),
        notes: result.project.notes || '',
      });
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save project settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={{ color: '#6b7280' }}>Loading project setup...</p>;
  }

  const isAdmin = userRole === 'admin';
  const budgetValue = Number(formData.overall_budget || 0);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.35rem' }}>Project Setup</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>Set the overall project budget for the Sangpo Temple Renovation account.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <MetricCard label="Project Name" value={project?.name || formData.name} />
        <MetricCard
          label="Overall Budget"
          value={new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(budgetValue)}
        />
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)', border: '1px solid rgba(0,0,0,0.05)', maxWidth: '760px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Project Name">
            <input value={formData.name} disabled={!isAdmin} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Overall Budget">
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.overall_budget}
              disabled={!isAdmin}
              onChange={(e) => setFormData({ ...formData, overall_budget: e.target.value })}
              style={inputStyle}
            />
          </Field>
          <Field label="Notes">
            <textarea
              rows={4}
              value={formData.notes}
              disabled={!isAdmin}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>
          {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
          {isAdmin ? (
            <div>
              <button type="submit" disabled={saving} style={{ backgroundColor: '#780000', color: 'white', padding: '0.75rem 1.35rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '600', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Project Budget'}
              </button>
            </div>
          ) : (
            <p style={{ color: '#6b7280', margin: 0 }}>Only admin can update the project budget.</p>
          )}
        </form>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
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

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '2px solid #e5e7eb',
  borderRadius: '0.5rem',
  fontSize: '1rem',
  outline: 'none',
};
