import React from 'react';
import { Footer } from '@/components/layout/Footer';

const sections = [
  {
    title: 'Public JSON Test',
    body: 'The public website flow is intended for lightweight evaluation only. It should accept a single URL, return JSON output only, and be protected by backend rate limits.',
    bullets: ['Single public URL input', 'JSON-only response path', 'No production credentials', 'No vector connector exposure'],
  },
  {
    title: 'Account and Billing',
  body: 'Teams can sign up with Google or email, choose a monthly or annual plan, and complete secure card checkout before using paid workspace features.',
  bullets: ['Google signup', 'Email and password signup', 'Monthly billing', 'Annual billing'],
  },
  {
    title: 'Outputs and Delivery',
    body: 'Apexverse can prepare structured outputs for downstream AI pipelines, human review, or direct delivery into supported retrieval infrastructure.',
    bullets: ['JSON exports', 'Markdown exports', 'Chunked text plus metadata', 'CSV metadata and operational views'],
  },
  {
    title: 'Vector Delivery',
    body: 'Vector database configuration is handled in the authenticated workspace after signup. Customer-managed connector credentials are not part of the public evaluation flow.',
    bullets: ['Pinecone alignment', 'Qdrant alignment', 'Weaviate alignment', 'Dashboard-based connector setup'],
  },
  {
    title: 'Operational Controls',
    body: 'Teams can define how content should be recrawled, monitored, and handed off into downstream systems so website changes do not leave AI experiences stale.',
    bullets: ['Scheduled recrawls', 'Change-aware refresh workflows', 'Connector and delivery review', 'Operational visibility across jobs'],
  },
] as const;

export default function DocsPage() {
  return (
    <div className="ai">
      <div style={{ position: 'relative', padding: '100px 24px 60px', background: 'var(--bg)', textAlign: 'center', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,98,42,.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, margin: '0 auto' }}>
          <div className="stag">Documentation</div>
          <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontFamily: 'var(--ffd)', fontWeight: 800, marginBottom: 16, letterSpacing: '-.02em' }}>Technical workflow overview</h1>
          <p style={{ fontSize: 18, color: 'var(--text3)', maxWidth: 620, margin: '0 auto', lineHeight: 1.7 }}>
            Apexverse helps teams move from website content to structured AI inputs. Public evaluation stays JSON-only; paid workspaces unlock dashboard controls, subscriptions, and connector setup.
          </p>
        </div>
      </div>

      <div style={{ padding: '64px 24px', maxWidth: 920, margin: '0 auto' }}>
        <section className="pcard ch" style={{ marginBottom: 40, borderRadius: 'var(--rxl)', padding: '40px' }}>
          <h2 style={{ fontSize: 26, fontFamily: 'var(--ffd)', fontWeight: 700, marginBottom: 20 }}>How Apexverse fits into an AI stack</h2>
          <ol style={{ marginLeft: 24, marginBottom: 32, color: 'var(--text2)', fontSize: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>Run a lightweight public JSON test if you want to validate extraction quality.</li>
            <li>Sign up with Google or email and choose a monthly or annual plan.</li>
            <li>Configure crawl scope, output behavior, and delivery settings in the workspace.</li>
            <li>Connect supported vector databases from the dashboard when needed.</li>
            <li>Recrawl and refresh content as the source site changes.</li>
          </ol>
          <div className="code" style={{ marginTop: 12 }}>
            {'POST /v1/jobs'}
            <br />
            {'{'}
            <br />
            {'  "source_url": "https://docs.example.com",'}
            <br />
            {'  "mode": "json_export",'}
            <br />
            {'  "crawl_policy": "docs-site"'}
            <br />
            {'}'}
          </div>
        </section>

        {sections.map(section => (
          <section key={section.title} className="pcard ch" style={{ marginBottom: 28, borderRadius: 'var(--rxl)', padding: '34px 40px' }}>
            <h2 style={{ fontSize: 24, fontFamily: 'var(--ffd)', fontWeight: 700, marginBottom: 12 }}>{section.title}</h2>
            <p style={{ color: 'var(--text3)', fontSize: 15, lineHeight: 1.75, marginBottom: 16 }}>{section.body}</p>
            <ul style={{ marginLeft: 24, color: 'var(--text2)', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.bullets.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Footer />
    </div>
  );
}
