'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ProjectOption = {
  id: string;
  name: string;
  overall_budget: number;
};

type Props = {
  onChange?: () => void;
};

export default function ProjectSelector({ onChange }: Props) {
  const supabase = createClient();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const savedProjectId =
          typeof window !== 'undefined' ? window.localStorage.getItem('sangpo_project_id') : null;

        const response = await fetch('/api/projects');
        const result = await response.json();
        if (!response.ok) return;

        const list = (result.projects || []) as ProjectOption[];
        setProjects(list);

        const defaultId = savedProjectId || result.defaultProjectId;
        const fallbackId =
          list.find((project) => project.id === defaultId)?.id || list[0]?.id || '';

        setActiveProjectId(fallbackId);
        writeCookie(fallbackId);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  function writeCookie(id: string) {
    if (typeof document === 'undefined') return;
    const maxAge = 60 * 60 * 24 * 30;
    document.cookie = `sangpo_project_id=${encodeURIComponent(id)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }

  function selectProject(id: string) {
    if (!id) return;
    setActiveProjectId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sangpo_project_id', id);
    }
    writeCookie(id);
    setOpen(false);
    window.setTimeout(() => {
      if (onChange) onChange();
      if (typeof window !== 'undefined') window.location.reload();
    }, 40);
  }

  if (loading || projects.length <= 1) {
    return null;
  }

  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((flag) => !flag)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: '240px',
          maxWidth: '320px',
          padding: '0.5rem 0.85rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(127, 29, 29, 0.18)',
          background: '#ffffff',
          color: '#1f2937',
          fontWeight: 600,
          cursor: 'pointer',
          gap: '0.5rem',
          textAlign: 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 700, marginRight: '0.45rem' }}>
          Project
        </span>
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.9rem',
          }}
        >
          {activeProject?.name || 'Select project'}
        </span>
        <span aria-hidden style={{ color: '#6b7280' }}>
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 0.35rem)',
            minWidth: '100%',
            background: '#ffffff',
            border: '1px solid rgba(15, 23, 42, 0.1)',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
            padding: '0.35rem',
            zIndex: 80,
          }}
        >
          {projects.map((project) => {
            const selected = project.id === activeProjectId;
            return (
              <button
                type="button"
                key={project.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectProject(project.id);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.7rem',
                  borderRadius: '0.55rem',
                  border: 'none',
                  background: selected ? 'rgba(127, 29, 29, 0.08)' : 'transparent',
                  color: selected ? '#7f1d1d' : '#111827',
                  fontWeight: selected ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {project.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
