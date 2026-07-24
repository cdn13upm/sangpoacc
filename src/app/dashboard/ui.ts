import type { CSSProperties } from 'react';

export const colors = {
  brand: '#7f1d1d',
  brandDark: '#5b1111',
  brandTint: '#fdf2f2',
  gold: '#c08a2b',
  ink: '#111827',
  muted: '#6b7280',
  line: '#e5e7eb',
  panel: '#ffffff',
  panelSoft: '#f8fafc',
  page: '#f5f5f4',
  success: '#15803d',
  successTint: '#ecfdf5',
  warning: '#b45309',
  warningTint: '#fffbeb',
};

export const contentWrapStyle: CSSProperties = {
  width: '100%',
  maxWidth: '1280px',
  margin: '0 auto',
};

export const pageHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem',
  marginBottom: '1.75rem',
  flexWrap: 'wrap',
};

export const sectionTitleStyle: CSSProperties = {
  fontSize: '2rem',
  fontWeight: 800,
  color: colors.ink,
  margin: 0,
  marginBottom: '0.35rem',
};

export const sectionSubtitleStyle: CSSProperties = {
  color: colors.muted,
  margin: 0,
  fontSize: '0.96rem',
  lineHeight: 1.6,
};

export const summaryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
};

export const summaryCardStyle: CSSProperties = {
  backgroundColor: colors.panel,
  borderRadius: '1rem',
  padding: '1.15rem 1.2rem',
  border: `1px solid ${colors.line}`,
  boxShadow: '0 16px 40px -28px rgba(15, 23, 42, 0.38)',
};

export const panelStyle: CSSProperties = {
  backgroundColor: colors.panel,
  borderRadius: '1rem',
  padding: '1.35rem',
  border: `1px solid ${colors.line}`,
  boxShadow: '0 16px 40px -28px rgba(15, 23, 42, 0.32)',
};

export const tablePanelStyle: CSSProperties = {
  ...panelStyle,
  padding: 0,
  overflow: 'hidden',
};

export const panelTitleStyle: CSSProperties = {
  fontSize: '1.08rem',
  fontWeight: 700,
  color: colors.ink,
  margin: 0,
  marginBottom: '1rem',
};

export const formGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem 1.1rem',
};

export const fieldWrapStyle: CSSProperties = {
  minWidth: 0,
};

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.88rem',
  fontWeight: 700,
  color: '#374151',
  marginBottom: '0.45rem',
};

export const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.8rem 0.95rem',
  border: '1px solid #d6d3d1',
  borderRadius: '0.8rem',
  fontSize: '0.96rem',
  outline: 'none',
  backgroundColor: '#ffffff',
  color: colors.ink,
  boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: 1.5,
};

export const primaryButtonStyle: CSSProperties = {
  background: `linear-gradient(135deg, ${colors.brand} 0%, ${colors.brandDark} 100%)`,
  color: 'white',
  padding: '0.82rem 1.35rem',
  borderRadius: '0.8rem',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.95rem',
  boxShadow: '0 14px 30px -18px rgba(127, 29, 29, 0.9)',
};

export const secondaryButtonStyle: CSSProperties = {
  backgroundColor: '#f5f5f4',
  color: colors.ink,
  padding: '0.78rem 1.25rem',
  borderRadius: '0.8rem',
  border: `1px solid ${colors.line}`,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.94rem',
};

export const tableWrapStyle: CSSProperties = {
  width: '100%',
  overflowX: 'auto',
};

export const headerCellStyle: CSSProperties = {
  padding: '0.95rem 1.1rem',
  textAlign: 'left',
  borderBottom: `1px solid ${colors.line}`,
  color: '#374151',
  fontWeight: 700,
  fontSize: '0.86rem',
  backgroundColor: '#fafaf9',
  whiteSpace: 'nowrap',
};

export const bodyCellStyle: CSSProperties = {
  padding: '0.95rem 1.1rem',
  color: '#4b5563',
  verticalAlign: 'top',
};
