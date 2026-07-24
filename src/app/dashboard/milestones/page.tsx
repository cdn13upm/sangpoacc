'use client';

import Link from 'next/link';
import {
  colors,
  pageHeaderStyle,
  panelStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionSubtitleStyle,
  sectionTitleStyle,
} from '../ui';

export default function MilestonesPage() {
  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={sectionTitleStyle}>Milestones</h1>
          <p style={sectionSubtitleStyle}>
            The current milestone logic is temporarily switched off while we revamp the workflow.
          </p>
        </div>
      </div>

      <div
        style={{
          ...panelStyle,
          maxWidth: '880px',
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 76%)',
          border: '1px solid #fed7aa',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.75rem',
            borderRadius: '999px',
            backgroundColor: '#fff7ed',
            color: colors.warning,
            fontSize: '0.82rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '1rem',
          }}
        >
          Temporary Off
        </div>

        <h2 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.35rem', color: colors.ink, fontWeight: 800 }}>
          Milestone and old VO logic are under revision
        </h2>
        <p style={{ margin: 0, color: colors.muted, lineHeight: 1.7, maxWidth: '700px' }}>
          I kept the previous milestone page logic in the codebase, but this live screen is paused for now so you can avoid using the wrong workflow.
          Use the new Variation Orders screen for admin VO key-in only.
        </p>

        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '1.4rem' }}>
          <Link href="/dashboard/variation-orders" style={{ ...primaryButtonStyle, textDecoration: 'none' }}>
            Open Variation Orders
          </Link>
          <span style={{ ...secondaryButtonStyle, cursor: 'default' }}>
            Legacy milestone logic kept on file
          </span>
        </div>
      </div>
    </div>
  );
}
