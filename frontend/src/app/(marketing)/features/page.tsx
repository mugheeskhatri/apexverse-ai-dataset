"use client";

import React from 'react';
import { I } from '@/components/Icons';
import { Footer } from '@/components/layout/Footer';

const featureRows = [
  {
    ico: 'globe',
    t: 'Controlled Website Crawling',
    c: 'var(--brand)',
    d: 'Start from a root URL, follow the paths that matter, and keep ingestion scope aligned with the content your AI systems actually need.',
    points: ['Path and depth controls', 'Sitemap-aware discovery', 'Robots-aware crawl strategy', 'Single-domain or multi-section coverage'],
  },
  {
    ico: 'cpu',
    t: 'JavaScript-Aware Extraction',
    c: 'var(--blue)',
    d: 'Process sites that rely on frontend rendering, dynamic navigation, or client-side content assembly without rewriting custom scrapers for each target.',
    points: ['Browser-based rendering', 'Dynamic page capture', 'Navigation-aware extraction', 'Support for docs portals and SPAs'],
  },
  {
    ico: 'layers',
    t: 'Retrieval-Ready Chunking',
    c: 'var(--green)',
    d: 'Prepare clean chunks with metadata so downstream retrieval, search, and grounding workflows do not start from raw website HTML.',
    points: ['Configurable chunk size', 'Overlap controls', 'Section-aware splitting', 'Metadata preserved per chunk'],
  },
  {
    ico: 'database',
    t: 'Vector Delivery Workflow',
    c: 'var(--yellow)',
    d: 'Move from crawl to delivery in a controlled workflow once the workspace is active and connector settings are configured in the dashboard.',
    points: ['Pinecone, Qdrant, Weaviate alignment', 'Customer-managed credentials', 'Export-first or direct-sync flow', 'Production setup after signup'],
  },
] as const;

export default function FeaturesPage() {
  return (
    <div className="ai">
      <div style={{ position: 'relative', padding: '100px 24px 60px', background: 'var(--bg)', textAlign: 'center', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,98,42,.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 780, margin: '0 auto' }}>
          <div className="stag">Platform Features</div>
          <h1 style={{ fontSize: 'clamp(36px,5vw,60px)', fontFamily: 'var(--ffd)', fontWeight: 800, marginBottom: 16, letterSpacing: '-.02em' }}>Engineered for production AI ingestion</h1>
          <p style={{ fontSize: 18, color: 'var(--text3)', maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Apexverse is designed for teams that need repeatable website ingestion, structured outputs, retrieval-ready chunks, and controlled delivery into downstream AI systems.
          </p>

        </div>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 52 }}>
          {featureRows.map((feature, index) => (
            <div key={feature.t} className="feat-row" style={{ direction: index % 2 === 1 ? 'rtl' : 'ltr' }}>
              <div style={{ direction: 'ltr' }}>
                <div style={{ width: 48, height: 48, background: `${feature.c}14`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <I n={feature.ico} s={22} c={feature.c} />
                </div>
                <h2 style={{ fontSize: 'clamp(22px,3vw,30px)', fontFamily: 'var(--ffd)', marginBottom: 12 }}>{feature.t}</h2>
                <p style={{ fontSize: 16, color: 'var(--text3)', lineHeight: 1.75, marginBottom: 24 }}>{feature.d}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {feature.points.map(point => (
                    <li key={point} className="fxc" style={{ gap: 10, fontSize: 15, color: 'var(--text2)' }}>
                      <I n="check" s={16} c="var(--green)" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="ch" style={{ direction: 'ltr', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--rxl)', padding: 32, boxShadow: 'var(--sh3)' }}>
                <div style={{ background: `${feature.c}05`, border: `1px solid ${feature.c}18`, borderRadius: 'var(--rlg)', padding: '24px' }}>
                  <div className="fxc" style={{ gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: feature.c }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: feature.c, textTransform: 'uppercase', letterSpacing: '.05em' }}>{feature.t}</span>
                  </div>
                  {feature.points.map(point => (
                    <div key={point} className="fxc" style={{ gap: 10, padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--rlg)', border: '1px solid var(--border)', marginBottom: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: feature.c, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: 'var(--text2)' }}>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
