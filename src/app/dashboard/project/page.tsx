'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
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
  secondaryButtonStyle,
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
  created_at: string;
};

const emptyForm = {
  name: '',
  overall_budget: '0',
  notes: '',
};

function formatCurrency(value: number | null | undefined) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(safeValue);
}

export default function ProjectPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);

  const isAdmin = userRole === 'admin';
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

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

        const projectsResponse = await fetch('/api/projects');
        const projectsResult = await projectsResponse.json();
        if (!projectsResponse.ok) throw new Error(projectsResult.error || 'Failed to load projects');

        const list = (projectsResult.projects || []) as ProjectRecord[];
        setProjects(list);

        const savedProjectId =
          typeof window !== 'undefined' ? window.localStorage.getItem('sangpo_project_id') : null;

        const defaultId =
          savedProjectId || projectsResult.defaultProjectId || list[0]?.id || '';
        const resolvedId = list.find((project) => project.id === defaultId)?.id || list[0]?.id || '';
        setSelectedProjectId(resolvedId);

        const active = list.find((project) => project.id === resolvedId) || null;
        if (active) {
          setFormData({
            name: active.name || '',
            overall_budget: String(active.overall_budget || 0),
            notes: active.notes || '',
          });
        }
      } catch (loadError: any) {
        setError(loadError.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleSelectProject(id: string) {
    if (!id) return;
    setSelectedProjectId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sangpo_project_id', id);
    }
    if (typeof document !== 'undefined') {
      const maxAge = 60 * 60 * 24 * 30;
      document.cookie = `sangpo_project_id=${encodeURIComponent(id)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    }

    const active = projects.find((project) => project.id === id) || null;
    if (active) {
      setFormData({
        name: active.name || '',
        overall_budget: String(active.overall_budget || 0),
        notes: active.notes || '',
      });
    }

    if (typeof window !== 'undefined') {
      window.setTimeout(() => window.location.reload(), 30);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create project');

      setProjects((list) => [...list, result.project]);
      setShowCreate(false);
      setCreateForm(emptyForm);
      setSelectedProjectId(result.project.id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('sangpo_project_id', result.project.id);
      }
      if (typeof document !== 'undefined') {
        const maxAge = 60 * 60 * 24 * 30;
        document.cookie = `sangpo_project_id=${encodeURIComponent(result.project.id)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      }
      setFormData({
        name: result.project.name || '',
        overall_budget: String(result.project.overall_budget || 0),
        notes: result.project.notes || '',
      });
      window.setTimeout(() => window.location.reload(), 30);
    } catch (createError: any) {
      setError(createError.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/project', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProjectId, ...formData }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save project');

      setProjects((list) =>
        list.map((project) => (project.id === result.project.id ? result.project : project))
      );
      setFormData({
        name: result.project.name || '',
        overall_budget: String(result.project.overall_budget || 0),
        notes: result.project.notes || '',
      });
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: ProjectRecord) {
    if (!isAdmin) return;
    if (projects.length <= 1) {
      setError('You must keep at least one project.');
      return;
    }
    if (!confirm(`Delete project ${project.name}?`)) return;
    try {
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: project.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete project');
      const remaining = projects.filter((item) => item.id !== project.id);
      setProjects(remaining);
      if (selectedProjectId === project.id) {
        const nextId = remaining[0]?.id || '';
        setSelectedProjectId(nextId);
        if (typeof window !== 'undefined') {
          if (nextId) {
            window.localStorage.setItem('sangpo_project_id', nextId);
          } else {
            window.localStorage.removeItem('sangpo_project_id');
          }
        }
        const nextProject = remaining.find((item) => item.id === nextId) || null;
        if (nextProject) {
          setFormData({
            name: nextProject.name || '',
            overall_budget: String(nextProject.overall_budget || 0),
            notes: nextProject.notes || '',
          });
        }
      }
    } catch (deleteError: any) {
      setError(deleteError.message || 'Failed to delete project');
    }
  }

  if (loading) {
    return <p style={{ color: colors.muted }}>Loading project setup...</p>;
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={sectionTitleStyle}>Project Setup</h1>
          <p style={sectionSubtitleStyle}>
            Add, switch and manage multiple project budgets. All modules below filter by the active project you select in the top-right dropdown.
          </p>
        </div>
      </div>

      <div
        style={{
          ...panelStyle,
          marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, #fff8f7 0%, #ffffff 70%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '760px' }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.82rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: colors.brand,
              }}
            >
              Multi-Project Foundation
            </p>
            <h2
              style={{
                margin: '0.35rem 0 0.45rem',
                fontSize: '1.55rem',
                fontWeight: 800,
                color: colors.ink,
              }}
            >
              Switch projects from the top-right dropdown
            </h2>
            <p style={{ margin: 0, color: colors.muted, lineHeight: 1.65 }}>
              Each project keeps its own budget, suppliers, milestones, VO, certificates, payments and unpaid invoices.
            </p>
          </div>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setShowCreate((flag) => !flag)}
              style={primaryButtonStyle}
            >
              {showCreate ? 'Cancel New Project' : 'Add New Project'}
            </button>
          ) : null}
        </div>
      </div>

      {isAdmin && showCreate ? (
        <div style={{ ...panelStyle, marginBottom: '1.5rem', maxWidth: '960px' }}>
          <h2 style={{ ...sectionTitleStyle, fontSize: '1.15rem', marginBottom: '0.6rem' }}>
            Create New Project
          </h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={formGridStyle}>
              <Field label="Project Name">
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  style={inputStyle}
                  placeholder="e.g. Phase 2 Extension"
                />
              </Field>
              <Field label="Overall Budget">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.overall_budget}
                  onChange={(e) => setCreateForm({ ...createForm, overall_budget: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                rows={3}
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                style={textareaStyle}
                placeholder="Optional notes for this project"
              />
            </Field>
            {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={saving}
                style={{ ...primaryButtonStyle, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div style={{ ...summaryGridStyle, marginBottom: '1.25rem' }}>
        <MetricCard label="Projects" value={String(projects.length)} />
        <MetricCard label="Selected Project" value={selectedProject?.name || '-'} />
        <MetricCard
          label="Selected Project Budget"
          value={formatCurrency(selectedProject?.overall_budget)}
        />
      </div>

      <div style={{ ...panelStyle, maxWidth: '920px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1.1rem',
          }}
        >
          <div style={{ minWidth: 0, maxWidth: '520px' }}>
            <Field label="Active Project">
              <select
                value={selectedProjectId}
                onChange={(e) => handleSelectProject(e.target.value)}
                style={inputStyle}
              >
                {projects.length === 0 ? (
                  <option value="">No projects yet</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))
                )}
              </select>
            </Field>
          </div>
        </div>

        {selectedProject ? (
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
                  onChange={(e) =>
                    setFormData({ ...formData, overall_budget: e.target.value })
                  }
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

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
              }}
            >
              {isAdmin ? (
                <button
                  type="submit"
                  disabled={saving}
                  style={{ ...primaryButtonStyle, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save Project Setup'}
                </button>
              ) : (
                <p style={{ color: colors.muted, margin: 0 }}>Only admin can update project setup.</p>
              )}
              {isAdmin ? (
                <button
                  type="button"
                  style={{
                    ...secondaryButtonStyle,
                    backgroundColor: '#fef2f2',
                    borderColor: '#fecaca',
                    color: '#991b1b',
                  }}
                  onClick={() => handleDelete(selectedProject)}
                >
                  Delete Selected Project
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <p style={{ color: colors.muted, margin: 0 }}>
            Select a project to view or edit its budget details.
          </p>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryCardStyle}>
      <p
        style={{
          color: colors.muted,
          fontSize: '0.82rem',
          margin: 0,
          marginBottom: '0.35rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: colors.ink,
          fontSize: '1.2rem',
          fontWeight: 800,
          margin: 0,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </p>
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
