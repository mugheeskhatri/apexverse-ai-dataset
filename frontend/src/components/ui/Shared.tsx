import React from 'react';

export const Logo = ({ dark }: { dark?: boolean }) => (
  <div className="logo">
    <div className="lm">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
        <line x1="12" y1="2" x2="12" y2="22"/>
        <line x1="2" y1="8.5" x2="22" y2="8.5"/>
        <line x1="2" y1="15.5" x2="22" y2="15.5"/>
      </svg>
    </div>
    <span className="lt" style={dark ? { color: 'white' } : {}}>
      <span style={dark ? { color: 'white' } : {}}>Apex</span>
      <span style={{ color: 'var(--brand)' }}>verse</span>
    </span>
  </div>
);

export const SBadge = ({ status }: { status: string }) => {
  const m: Record<string, { cls: string, l: string, dot?: boolean }> = {
    active: { cls: 'bgg', l: 'Active', dot: true },
    processing: { cls: 'bgb', l: 'Processing', dot: true },
    failed: { cls: 'bgr2', l: 'Failed' },
    completed: { cls: 'bgg', l: 'Completed' },
    pending: { cls: 'bgy', l: 'Pending' },
    extracted: { cls: 'bgg', l: 'Extracted' },
    skipped: { cls: 'bggr', l: 'Skipped' },
    paid: { cls: 'bgg', l: 'Paid' },
    ready: { cls: 'bgg', l: 'Ready' },
  };
  const c = m[status] || { cls: 'bggr', l: status };
  return (
    <span className={'badge ' + c.cls}>
      {c.dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />}
      {c.l}
    </span>
  );
};

export const SkCard = () => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
    <div className="sk" style={{ height: 12, width: '55%' }} />
    <div className="sk" style={{ height: 26, width: '38%' }} />
    <div className="sk" style={{ height: 10, width: '75%' }} />
  </div>
);
