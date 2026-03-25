"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { I } from '@/components/Icons';
import { Footer } from '@/components/layout/Footer';

const enterpriseCards = [
  ['key', 'Identity and Access', 'Support SSO, SAML, role definition, and controlled workspace provisioning for production teams.', 'var(--brand)'],
  ['users', 'Onboarding and Review', 'Scope domains, crawl behavior, delivery requirements, and access controls with your stakeholders before rollout.', 'var(--yellow)'],
  ['database', 'Deployment Planning', 'Review hosted, private, or customer-specific deployment expectations based on security and operational requirements.', 'var(--blue)'],
  ['activity', 'Operational Auditability', 'Track jobs, ingestion history, and delivery outcomes across ongoing website update cycles.', 'var(--green)'],
  ['lock', 'Credential Handling', 'Customer-managed connector credentials are configured in the dashboard after signup rather than the public evaluation flow.', 'var(--blue)'],
  ['shield', 'Enterprise Readiness', 'Support procurement, technical review, architecture planning, and rollout coordination for AI search and retrieval programs.', 'var(--green)'],
] as const;

export default function EnterprisePage() {
  const router = useRouter();

  return (
    <div className="ai">
      <div style={{ padding: '84px 24px 60px', background: 'var(--accent)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 50%,rgba(255,255,255,.03) 0%,transparent 60%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '5px 13px', background: 'rgba(255,255,255,.09)', borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.68)', marginBottom: 16 }}>Enterprise</div>
          <h1 style={{ fontSize: 'clamp(30px,5vw,52px)', color: 'white', fontFamily: 'var(--ffd)', fontWeight: 800, marginBottom: 13, lineHeight: 1.1 }}>Website ingestion infrastructure for enterprise AI programs</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.72)', lineHeight: 1.75, marginBottom: 34 }}>
            Apexverse supports self-serve plans for standard teams and enterprise collaboration for organizations that need deployment planning, security review, or custom rollout support.
          </p>
          <div className="fxc" style={{ justifyContent: 'center', gap: 11, flexWrap: 'wrap' }}>
            <button className="btn bxl" style={{ background: 'white', color: 'var(--accent)' }} onClick={() => router.push('/contact')}>Contact enterprise</button>
            <button className="btn bxl" style={{ background: 'rgba(255,255,255,.09)', color: 'white', border: '1px solid rgba(255,255,255,.18)' }} onClick={() => router.push('/docs')}>Review docs</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '60px 24px' }}>
        <div className="g3 mb6">
          {enterpriseCards.map(([icon, title, description, color]) => (
            <div key={title} className="card ch" style={{ borderRadius: 'var(--rxl)', padding: '32px 24px' }}>
              <div style={{ width: 48, height: 48, background: `${color}12`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <I n={icon} s={22} c={color} />
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.75 }}>{description}</p>
            </div>
          ))}
        </div>
        <div className="ch" style={{ background: 'var(--surface)', boxShadow: 'var(--sh3)', border: '1px solid var(--border)', borderRadius: 'var(--rxl)', padding: '60px 40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontFamily: 'var(--ffd)', marginBottom: 16 }}>Need a deployment review?</h2>
          <p style={{ fontSize: 16, color: 'var(--text3)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.75 }}>
            Start with a self-serve plan when standard product workflows fit. Bring us in when you need private deployment review, expanded controls, or custom rollout planning.
          </p>
          <div className="fxc" style={{ justifyContent: 'center', gap: 11, flexWrap: 'wrap' }}>
            <button className="btn bp blg" onClick={() => router.push('/contact')}>Contact us</button>
            <button className="btn bs blg" onClick={() => router.push('/pricing')}>View plans</button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
