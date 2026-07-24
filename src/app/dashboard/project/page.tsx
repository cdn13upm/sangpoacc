'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  colors,
  fieldWrapStyle,
  formGridStyle,
  inputStyle,
  labelStyle,
  pageHeaderStyle,
  panelStyle,
  primaryButtonStyle,
  sectionSubtitleStyle,
  sectionTitleStyle,
  summaryCardStyle,
  summaryGridStyle,
  textareaStyle,
} from '../ui';

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
    return <p style={{ color: colors.muted }}>Loading project setup...</p>;
  }

  const isAdmin = userRole === 'admin';
  const budgetValue = Number(formData.overall_budget || 0);

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={sectionTitleStyle}>Project Setup</h1>
          <p style={sectionSubtitleStyle}>
            Set the base project budget and notes for the Sangpo Temple Renovation account.
          </p>
        </div>
      </div>

      <div
        style={{
          ...panelStyle,
          marginBottom: '1.2rem',
          background: 'linear-gradient(135deg, #fff8f7 0%, #ffffff 70%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '760px' }}>
            <p style={{ margin: 0, fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.brand }}>
              Budget Foundation
            </p>
            <h2 style={{ margin: '0.35rem 0 0.45rem', fontSize: '1.55rem', fontWeight: 800, color: colors.ink }}>
              Keep the original project budget clear from day one
            </h2>
            <p style={{ margin: 0, color: colors.muted, lineHeight: 1.65 }}>
              This amount acts as the financial baseline before supplier awards, milestone claims, and variation orders are tracked.
            </p>
          </div>
        </div>
      </div>

      <div style={{ ...summaryGridStyle, marginBottom: '1.25rem' }}>
        <MetricCard label="Project Name" value={project?.name || formData.name} />
        <MetricCard
          label="Overall Budget"
          value={new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(budgetValue)}
        />
      </div>

      <div style={{ ...panelStyle, maxWidth: '920px' }}>
        <div style={{ marginBottom: '1.1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: colors.ink }}>Project Details</h2>
          <p style={{ ...sectionSubtitleStyle, marginTop: '0.25rem', fontSize: '0.92rem' }}>
            All fields stay inside the form card now, including longer notes and wider numeric values.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={formGridStyle}>
            <Field label="Project Name">
              <input
                value={formData.name}
                disabled={!isAdmin}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
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
          </div>

          <Field label="Notes">
            <textarea
              rows={5}
              value={formData.notes}
              disabled={!isAdmin}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={textareaStyle}
            />
          </Field>

          {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}

          {isAdmin ? (
            <div>
              <button type="submit" disabled={saving} style={{ ...primaryButtonStyle, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Project Budget'}
              </button>
            </div>
          ) : (
            <p style={{ color: colors.muted, margin: 0 }}>Only admin can update the project budget.</p>
          )}
        </form>
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
      <p style={{ color: colors.ink, fontSize: '1.2rem', fontWeight: 800, margin: 0, wordBreak: 'break-word' }}>{value}</p>
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
