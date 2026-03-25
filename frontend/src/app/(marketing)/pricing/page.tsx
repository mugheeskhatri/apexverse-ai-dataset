"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { I } from '@/components/Icons';
import { Footer } from '@/components/layout/Footer';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    basePrice: 19,
    pages: '1,000 pages',
    projects: '2 projects',
    desc: 'For early teams that need clean website exports and a simple self-serve setup.',
  features: ['1,000 pages per month', '2 active projects', 'Website crawling and extraction', 'JSON, CSV, and Markdown exports', 'Google or email signup', 'Secure card checkout'],
    cta: 'Choose Starter',
    btnClass: 'bp',
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    basePrice: 59,
    pages: '10,000 pages',
    projects: '5 projects',
    desc: 'For teams that need recurring crawls, richer controls, and more workspace capacity.',
    features: ['10,000 pages per month', '5 active projects', 'Scheduled crawls', 'JS-rendered page support', 'Advanced extraction controls', 'Priority support'],
    cta: 'Choose Growth',
    btnClass: 'bbr',
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    basePrice: 149,
    pages: '50,000 pages',
    projects: '20 projects',
    popular: true,
    desc: 'For production AI teams that need chunking, connectors, and dashboard-based delivery.',
    features: ['50,000 pages per month', '20 active projects', 'Retrieval-ready chunking', 'Vector database setup in dashboard', 'API access and webhooks', 'Analytics and priority support'],
    cta: 'Choose Professional',
    btnClass: 'bp',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    basePrice: null,
    pages: 'Custom pages',
    projects: 'Unlimited projects',
    desc: 'For larger deployments that require enterprise support, security review, or custom rollout requirements.',
    features: ['Custom usage model', 'SSO and SAML options', 'Private deployment review', 'Expanded support expectations', 'Architecture and rollout guidance', 'Custom commercial terms'],
    cta: 'Talk to sales',
    btnClass: 'bs',
    popular: false,
  },
] as const;

const pricingDrivers = [
  { ico: 'layers', t: 'Crawl Volume', d: 'How many sites, pages, and refresh cycles the workspace needs to support each month.' },
  { ico: 'database', t: 'Delivery Workflow', d: 'Whether the team needs exports only, dashboard-based connector setup, or direct vector delivery.' },
  { ico: 'shield', t: 'Access and Security', d: 'Whether a standard self-serve workspace is enough or enterprise controls are required.' },
  { ico: 'activity', t: 'Team Needs', d: 'How much project capacity, visibility, and support the team needs as usage grows.' },
] as const;

const faqs = [
  { q: 'Do you offer a free trial?', a: 'No free trial is listed here. Apexverse offers a limited public JSON-only test for evaluation, and paid workspaces begin after signup and checkout.' },
  { q: 'What does the public test include?', a: 'The public test is limited to a single URL and JSON output only. It is intended for lightweight evaluation and should be rate limited on the backend.' },
  { q: 'Can users sign up with Google or email?', a: 'Yes. Teams can create an account with Google or a local email and password flow before completing checkout.' },
  { q: 'How do customers pay?', a: 'Paid plans use secure card checkout, with monthly or annual billing options shown on this page.' },
  { q: 'When do customers connect vector databases and embedding providers?', a: 'That happens inside the customer dashboard after signup and plan activation. Public evaluation does not expose production credentials or connector setup.' },
] as const;

export default function PricingPage() {
  const router = useRouter();
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const calcPrice = (basePrice: number | null) => {
    if (basePrice === null) return null;
    return cycle === 'annual' ? Math.round(basePrice * 0.9) : basePrice;
  };

  return (
    <div className="ai">
  <div style={{ position: 'relative', padding: '80px 24px 20px', background: 'var(--bg)', textAlign: 'center', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,98,42,.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
          <div className="stag">Pricing</div>
          <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontFamily: 'var(--ffd)', fontWeight: 800, marginBottom: 16, letterSpacing: '-.02em' }}>Choose a monthly or annual plan</h1>
          <p style={{ fontSize: 18, color: 'var(--text3)', marginBottom: 32, lineHeight: 1.7 }}>
            Start with a self-serve plan, sign up with Google or email, and complete secure card checkout. Enterprise teams can still work with us on custom rollout requirements.
          </p>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div className="fxc" style={{ gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-light)', padding: '5px 11px', borderRadius: 6 }}>10% OFF annual</span>
            </div>
            <div className="tabs" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 100, padding: 6, boxShadow: 'var(--sh)', display: 'inline-flex' }}>
              {[
                { id: 'monthly', label: 'Monthly' },
                { id: 'annual', label: 'Annual' },
              ].map(option => (
                <button key={option.id} className={`tab${cycle === option.id ? ' act' : ''}`} onClick={() => setCycle(option.id as 'monthly' | 'annual')} style={{ borderRadius: 100, padding: '10px 24px', fontSize: 15 }}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '64px 24px' }}>
        <div className="card ch" style={{ marginBottom: 32, padding: '22px 24px' }}>
          <div className="fxb" style={{ gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Public website test</div>
              <div style={{ fontSize: 15, color: 'var(--text3)', lineHeight: 1.75 }}>A lightweight JSON-only extraction test stays available for evaluation before signup. Paid plans unlock workspace features and dashboard-based delivery.</div>
            </div>
            <button className="btn bs" onClick={() => router.push('/')}>Try JSON test</button>
          </div>
        </div>

        <div className="g4" style={{ marginBottom: 72, alignItems: 'stretch' }}>
          {plans.map(plan => (
            <div key={plan.id} className={`pcard ch${plan.popular ? ' feat' : ''}`} style={{ position: 'relative', display: 'flex', flexDirection: 'column', padding: '40px 28px', borderRadius: 'var(--rxl)' }}>
              {plan.popular && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--brand)', color: 'white', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '.04em', boxShadow: '0 4px 12px rgba(212,98,42,0.2)' }}>Most Popular</div>}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--ffd)', marginBottom: 10 }}>{plan.name}</h3>
                <div className="fxc" style={{ gap: 4, marginBottom: 12, minHeight: 48 }}>
                  {plan.basePrice !== null ? (
                    <>
                      <span style={{ fontFamily: 'var(--ffd)', fontSize: 40, fontWeight: 800 }}>${calcPrice(plan.basePrice)}</span>
                      <span style={{ fontSize: 15, opacity: 0.6 }}>/mo</span>
                    </>
                  ) : (
                    <span style={{ fontFamily: 'var(--ffd)', fontSize: 32, fontWeight: 800 }}>Custom</span>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{plan.pages}</div>
                <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 16 }}>{plan.projects}</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.8, minHeight: 68 }}>{plan.desc}</p>
              </div>

              <button
                className={`btn bfw mb4 ${plan.btnClass}`}
                style={{ justifyContent: 'center' }}
                onClick={() => {
                  if (plan.basePrice === null) {
                    router.push('/contact');
                    return;
                  }
                  router.push(`/signup?plan=${plan.id}&cycle=${cycle}`);
                }}
              >
                {plan.cta}
              </button>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12, opacity: 0.5 }}>Included</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(feature => (
                    <li key={feature} style={{ display: 'flex', gap: 10, fontSize: 14, lineHeight: 1.6 }}>
                      <I n="check" s={14} c="var(--brand)" style={{ marginTop: 2 }} />
                      <span style={{ opacity: 0.9 }}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="stag">What Shapes Pricing</div>
          <h2 style={{ fontSize: 28, fontFamily: 'var(--ffd)' }}>Self-serve by default, enterprise when needed</h2>
        </div>
        <div className="g4" style={{ marginBottom: 72 }}>
          {pricingDrivers.map(driver => (
            <div key={driver.t} className="card ch glass" style={{ borderRadius: 'var(--rxl)', padding: '30px 24px', background: 'rgba(255,255,255,0.22)', border: '1.5px solid var(--border)', boxShadow: '0 8px 32px 0 rgba(31,38,135,0.10)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
              <div style={{ width: 44, height: 44, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <I n={driver.ico} s={18} c="var(--text2)" />
              </div>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>{driver.t}</h3>
              <p style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.75 }}>{driver.d}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 760, margin: '0 auto 24px' }}>
          <div className="stag" style={{ textAlign: 'center', marginBottom: 4 }}>FAQ</div>
          <h2 style={{ fontSize: 24, fontFamily: 'var(--ffd)', textAlign: 'center', marginBottom: 24 }}>Plans and billing FAQs</h2>
          {faqs.map((faq, index) => (
            <div key={faq.q} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--rlg)', overflow: 'hidden' }}>
              <button onClick={() => setOpenFaq(openFaq === index ? null : index)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ff)', textAlign: 'left' }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{faq.q}</span>
                <I n={openFaq === index ? 'minus' : 'plus'} s={16} c="var(--text3)" />
              </button>
              {openFaq === index && <div style={{ padding: '0 20px 16px', fontSize: 15, color: 'var(--text3)', lineHeight: 1.75 }}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
