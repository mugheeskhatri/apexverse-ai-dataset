import React from 'react';
import { Footer } from '@/components/layout/Footer';

const principles = [
  ['Website content should not require custom ETL every time.', 'Apexverse was created to reduce the manual engineering work teams repeat whenever they need website content inside AI systems.'],
  ['AI retrieval quality starts with source quality.', 'We focus on turning web pages into clean, structured, reviewable inputs instead of pushing raw page output downstream.'],
  ['Enterprise rollouts need more than a scraper.', 'Real deployments require onboarding, delivery planning, access controls, and workflow design around the customer environment.'],
] as const;

export default function AboutPage() {
  return (
    <div className="ai">
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '72px 24px 80px' }}>
        <div className="stag">About Apexverse</div>
        <h1 style={{ fontSize: 'clamp(32px,4vw,48px)', fontFamily: 'var(--ffd)', marginBottom: 18 }}>Built for teams turning websites into AI infrastructure</h1>
        <p style={{ fontSize: 16, color: 'var(--text3)', lineHeight: 1.8, marginBottom: 36 }}>
          Apexverse exists to help AI teams ingest website content without rebuilding the same crawling, extraction, chunking, and delivery stack for every project. The goal is straightforward: make website knowledge usable inside retrieval, search, and enterprise AI systems.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {principles.map(([heading, body]) => (
            <section key={heading} className="card ch" style={{ padding: '28px 26px' }}>
              <h2 style={{ fontSize: 20, fontFamily: 'var(--ffd)', marginBottom: 10 }}>{heading}</h2>
              <p style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.8 }}>{body}</p>
            </section>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
