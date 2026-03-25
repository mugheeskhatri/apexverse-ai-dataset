"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';

const groups = [
  {
    t: 'Vector Databases',
    items: [
      ['Pinecone', '#1F6BD5', 'P', 'available', 'Namespace-aware vector delivery for production workflows.'],
      ['Qdrant', '#DC3545', 'Q', 'available', 'Collection-based delivery with payload metadata handling.'],
      ['Weaviate', '#4CAF50', 'W', 'available', 'Structured delivery into class-based search and retrieval workflows.'],
    ],
  },
  {
    t: 'Delivery Modes',
    items: [
      ['JSON Export', '#111827', 'JS', 'available', 'Structured export for downstream ETL, QA, and ingestion validation.'],
      ['Markdown Export', '#2563EB', 'MD', 'available', 'Readable content for review, prompting, and manual inspection.'],
      ['Chunked Output', '#059669', 'CH', 'available', 'Chunked text and metadata for retrieval pipelines and search systems.'],
      ['CSV Metadata', '#D97706', 'CSV', 'available', 'Operational export for indexing checks and content audits.'],
    ],
  },
  {
    t: 'Enterprise Workflow Support',
    items: [
      ['Customer Credentials', '#6B7280', 'KEY', 'available', 'Production connector settings are configured inside the customer dashboard after signup and plan activation.'],
      ['Embedding Workflow', '#0F766E', 'EMB', 'scoped', 'Embedding provider requirements are aligned inside the workspace or during enterprise deployment planning.'],
      ['Custom Connector Review', '#7C3AED', 'API', 'scoped', 'Custom delivery paths and enterprise connector requirements can be reviewed during solution design.'],
    ],
  },
] as const;

export default function IntegrationsPage() {
  const router = useRouter();

  return (
    <div className="ai">
      <div style={{ position: 'relative', padding: '100px 24px 60px', background: 'var(--bg)', textAlign: 'center', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,98,42,.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
          <div className="stag">Integrations</div>
          <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontFamily: 'var(--ffd)', fontWeight: 800, marginBottom: 16, letterSpacing: '-.02em' }}>Connect website ingestion to the rest of your AI stack</h1>
          <p style={{ fontSize: 18, color: 'var(--text3)', maxWidth: 620, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Public evaluation stays simple and JSON-based. Paid workspaces let teams configure customer-managed credentials and delivery settings from the dashboard after signup.
          </p>
          <div className="fxc" style={{ justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn bp blg" onClick={() => router.push('/signup')}>Start with a plan</button>
            <button className="btn bs blg" onClick={() => router.push('/docs')}>Read integration docs</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '56px 24px 80px' }}>
        {groups.map(group => (
          <div key={group.t} style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 20, fontFamily: 'var(--ffd)', marginBottom: 14 }}>{group.t}</h2>
            <div className="g2">
              {group.items.map(([name, color, label, status, description]) => (
                <div key={name} className="ch" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--rxl)' }}>
                  <div style={{ width: 44, height: 44, background: `${color}14`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color, flexShrink: 0 }}>{label}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{name}</div>
                    <div style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.7 }}>{description}</div>
                  </div>
                  {status === 'available' ? (
                    <span className="badge bgg">Available</span>
                  ) : (
                    <span className="badge bggr">Scoped</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
