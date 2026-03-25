"use client";

import React, { useState } from 'react';
import { I } from '@/components/Icons';
import { Footer } from '@/components/layout/Footer';
import { PublicExtractor } from '@/components/marketing/PublicExtractor';

const deliveryOptions = [
  ['JSON', 'Structured exports for downstream pipelines and QA review', 'code', 'var(--brand)'],
  ['Markdown', 'Readable content for prompt testing and internal review', 'file-text', 'var(--blue)'],
  ['Chunks', 'Chunked text plus metadata for retrieval workflows', 'layers', 'var(--green)'],
  ['CSV', 'Operational metadata for audits, checks, and handoff', 'grid', 'var(--yellow)'],
  ['Vector Sync', 'Dashboard-based delivery into supported vector indexes', 'database', 'var(--text2)'],
] as const;

const platformFeatures = [
  { ico: 'globe', t: 'Website Crawling', d: 'Discover and process documentation, knowledge bases, support centers, and multi-path websites with crawl controls.' },
  { ico: 'cpu', t: 'JavaScript Rendering', d: 'Handle modern SPAs and dynamically rendered pages with browser-based extraction when needed.' },
  { ico: 'code', t: 'Structured Extraction', d: 'Normalize titles, headings, body content, metadata, and links into consistent machine-readable outputs.' },
  { ico: 'layers', t: 'Chunking Controls', d: 'Prepare retrieval-ready chunks with configurable sizing, overlap, and content boundaries.' },
  { ico: 'database', t: 'Vector Delivery', d: 'Connect supported vector databases from the dashboard after signup and deliver processed chunks into production indexes.' },
  { ico: 'refresh-cw', t: 'Scheduled Recrawls', d: 'Keep knowledge fresh with repeat crawls, update detection, and controlled refresh workflows.' },
  { ico: 'shield', t: 'Workspace Access', d: 'Use self-serve subscriptions for standard teams and enterprise controls where larger deployments require them.' },
  { ico: 'activity', t: 'Operational Visibility', d: 'Track extraction activity, job outcomes, and downstream delivery status in one workflow.' },
] as const;

const enterpriseControls = [
  ['key', 'Identity and Access', 'SSO, SAML, and workspace-level access controls for production teams.'],
  ['users', 'Workspace Setup', 'Configure domains, teams, connectors, and extraction settings from the product after signup.'],
  ['activity', 'Auditability', 'Track ingestion activity, crawl history, and connector operations across environments.'],
  ['lock', 'Deployment Flexibility', 'Support hosted, private, and customer-specific deployment requirements during procurement.'],
] as const;

const faqs = [
  {
    q: 'What does the public test include?',
    a: 'The public test is for limited evaluation only. It accepts a single URL, returns JSON output only, and should be rate limited by the backend.',
  },
  {
    q: 'How do subscriptions work?',
  a: 'Teams can sign up with Google or email, choose a monthly or annual plan, and complete secure card checkout before using paid workspace features.',
  },
  {
    q: 'When are vector database connections configured?',
    a: 'Direct vector delivery is configured from the dashboard after signup and plan activation. Production connectors are not exposed through the public test flow.',
  },
  {
    q: 'Which vector databases are supported today?',
    a: 'Apexverse currently aligns with Pinecone, Qdrant, and Weaviate in the product experience shown here. Enterprise connector requirements can be reviewed separately if needed.',
  },
  {
    q: 'Can you crawl JavaScript-heavy websites?',
    a: 'Yes. Apexverse can process static sites and JavaScript-rendered applications, including documentation portals and support centers built on modern frontend frameworks.',
  },
  {
    q: 'How are customer credentials handled?',
    a: 'Vector database credentials and related production settings are configured inside the customer dashboard after signup, not through the public test form.',
  },
] as const;

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="ai">
      <section
        style={{
          padding: '100px 24px 80px',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '800px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,98,42,.06) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div className="stag" style={{ position: 'relative', zIndex: 1, marginBottom: 14 }}>Web Data Ingestion for Enterprise AI</div>
        <h1
          style={{
            fontSize: 'clamp(42px, 6vw, 74px)',
            fontWeight: 800,
            marginBottom: 0,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            position: 'relative',
            zIndex: 1,
            maxWidth: 920,
          }}
        >
          Turn Websites Into
          <br />
          <span style={{ color: '#d4622a', fontWeight: 800, fontSize: 'clamp(28px, 5vw, 48px)' }}>Production-Ready AI Knowledge</span>
        </h1>
        <p
          style={{
            fontSize: 18,
            color: 'var(--text3)',
            maxWidth: 760,
            margin: '20px auto 28px',
            lineHeight: 1.7,
            position: 'relative',
            zIndex: 1,
          }}
        >
          Crawl websites, extract structured content, prepare retrieval-ready chunks, and deliver clean knowledge into your AI stack.
          Start with a monthly or annual plan, sign up with Google or email, and manage connectors from the dashboard.
        </p>

        <PublicExtractor />
  <div className="fxc" style={{ gap: 12, flexWrap: 'wrap', marginTop: 8, position: 'relative', zIndex: 1 }}>
          {['Multi-site crawling', 'Structured exports and chunks', 'Scheduled recrawls', 'Vector database delivery'].map(item => (
            <div key={item} className="badge bggr" style={{ padding: '8px 12px' }}>{item}</div>
          ))}
        </div>
      </section>

  <div style={{ padding: '48px 24px 100px', background: 'var(--bg)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,98,42,.07) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div className="sec" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <div className="stag">Delivery Options</div>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', marginBottom: 16 }}>Flexible outputs for retrieval and indexing workflows</h2>
            <p style={{ fontSize: 16, color: 'var(--text3)', lineHeight: 1.75, marginBottom: 32 }}>
              Export clean content in developer-friendly formats or deliver processed chunks into production systems after signup and billing activation.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {deliveryOptions.map(([format, description, icon, color]) => (
                <div key={format} className="fxc ch glass" style={{ gap: 16, padding: '22px 26px', background: 'rgba(255,255,255,0.22)', border: '1.5px solid var(--border)', borderRadius: 'var(--rxl)', boxShadow: '0 8px 32px 0 rgba(31,38,135,0.10)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                  <div style={{ width: 38, height: 38, background: `${color}15`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <I n={icon} s={16} c={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{format}</div>
                    <div style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.65 }}>{description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="code ch terminal-glass"
            style={{
              background: 'linear-gradient(120deg, #181c23 80%, #23272f 100%)',
              color: '#e5e5e5',
              fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", monospace',
              fontSize: 15,
              borderRadius: 'var(--rxl)',
              border: '1.5px solid #23272f',
              boxShadow: '0 8px 32px 0 #000a, 0 0 0 1.5px #23272f',
              padding: '32px 28px 28px',
              minHeight: 320,
              lineHeight: 1.7,
              position: 'relative',
              overflowX: 'auto',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 14, color: '#7fffd4', marginBottom: 10, fontFamily: 'inherit' }}>{'// Example structured website output'}</div>
            <span style={{ color: '#fff' }}>{'{'}</span><br />
            <span style={{ color: '#ffb86c' }}>&quot;url&quot;</span>: <span style={{ color: '#8be9fd' }}>&quot;https://docs.example.com/api&quot;</span>,<br />
            <span style={{ color: '#ffb86c' }}>&quot;title&quot;</span>: <span style={{ color: '#50fa7b' }}>&quot;API Reference&quot;</span>,<br />
            <span style={{ color: '#ffb86c' }}>&quot;content_type&quot;</span>: <span style={{ color: '#50fa7b' }}>&quot;documentation&quot;</span>,<br />
            <span style={{ color: '#ffb86c' }}>&quot;chunks&quot;</span>: [<span style={{ color: '#fff' }}>{'{'}</span><br />
            <span style={{ color: '#ffb86c' }}>&quot;id&quot;</span>: <span style={{ color: '#50fa7b' }}>&quot;ch_001&quot;</span>,<br />
            <span style={{ color: '#ffb86c' }}>&quot;text&quot;</span>: <span style={{ color: '#50fa7b' }}>&quot;Authenticate requests with a bearer token...&quot;</span>,<br />
            <span style={{ color: '#ffb86c' }}>&quot;metadata&quot;</span>: <span style={{ color: '#fff' }}>{'{'}</span><span style={{ color: '#ffb86c' }}>&quot;section&quot;</span>: <span style={{ color: '#50fa7b' }}>&quot;Authentication&quot;</span><span style={{ color: '#fff' }}>{'}'}</span><br />
            <span style={{ color: '#fff' }}>{'}'}</span>],<br />
            <span style={{ color: '#ffb86c' }}>&quot;delivery&quot;</span>: <span style={{ color: '#50fa7b' }}>&quot;json_export&quot;</span><br />
            <span style={{ color: '#fff' }}>{'}'}</span>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '100px 24px' }}>
        <div className="sec">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="stag">Platform Features</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)' }}>Built for production AI ingestion</h2>
          </div>
          <div className="mini-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {platformFeatures.map(feature => (
              <div
                key={feature.t}
                className="card ch glass"
                style={{
                  borderRadius: 'var(--rxl)',
                  padding: '36px',
                  background: 'rgba(255,255,255,0.22)',
                  border: '1.5px solid var(--border)',
                  boxShadow: '0 8px 32px 0 rgba(31,38,135,0.10)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <div style={{ width: 44, height: 44, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <I n={feature.ico} s={18} c="var(--text2)" />
                </div>
                <h3 style={{ fontSize: 18, marginBottom: 10 }}>{feature.t}</h3>
                <p style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.75 }}>{feature.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 24px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,98,42,.07) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div className="sec" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="stag">Enterprise Controls</div>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', marginBottom: 48 }}>Designed for self-serve growth and enterprise rollout</h2>
          <div className="g4">
            {enterpriseControls.map(([icon, title, description]) => (
              <div key={title} className="pcard ch glass" style={{ textAlign: 'center', padding: '38px 24px', borderRadius: 'var(--rxl)', background: 'rgba(255,255,255,0.22)', border: '1.5px solid var(--border)', boxShadow: '0 8px 32px 0 rgba(31,38,135,0.10)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                <div style={{ width: 52, height: 52, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--sh)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <I n={icon} s={22} c="var(--text2)" />
                </div>
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.7 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg)', padding: '100px 24px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,98,42,.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="stag">FAQ</div>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)' }}>Questions buyers ask before rollout</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {faqs.map((faq, index) => (
              <div key={faq.q} className="ch glass" style={{ background: 'rgba(255,255,255,0.22)', border: '1.5px solid var(--border)', borderRadius: 'var(--rxl)', overflow: 'hidden', boxShadow: '0 8px 32px 0 rgba(31,38,135,0.10)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ff)', textAlign: 'left' }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{faq.q}</span>
                  <I n={openFaq === index ? 'minus' : 'plus'} s={16} c="var(--text3)" />
                </button>
                {openFaq === index && <div style={{ padding: '0 22px 18px', fontSize: 15, color: 'var(--text3)', lineHeight: 1.75 }}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
