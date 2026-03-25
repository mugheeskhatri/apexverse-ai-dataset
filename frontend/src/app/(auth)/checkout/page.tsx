"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { I, Spin } from '@/components/Icons';
import { useAuth } from '@/lib/auth';

type PlanId = 'starter' | 'growth' | 'professional';
type Cycle  = 'monthly' | 'annual';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const planMeta: Record<PlanId, { label: string; monthly: number; summary: string; blurb: string }> = {
  starter:      { label: 'Starter',      monthly: 19,  summary: '1,000 pages · 2 projects',  blurb: 'For early teams launching clean exports.' },
  growth:       { label: 'Growth',       monthly: 59,  summary: '10,000 pages · 5 projects', blurb: 'For recurring crawls and growing production usage.' },
  professional: { label: 'Professional', monthly: 149, summary: '50,000 pages · 20 projects', blurb: 'For production AI teams that need chunking, connectors, and delivery.' },
};

const isPlanId = (v: string | null): v is PlanId => v === 'starter' || v === 'growth' || v === 'professional';

function CheckoutForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { token }    = useAuth();

  const rawPlan = searchParams.get('plan');
  const plan:  PlanId = isPlanId(rawPlan) ? rawPlan : 'starter';
  const cycle: Cycle  = searchParams.get('cycle') === 'annual' ? 'annual' : 'monthly';

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const sel      = planMeta[plan];
  const price    = cycle === 'annual' ? sel.monthly * 0.9 : sel.monthly;
  const dueToday = cycle === 'annual' ? price * 12 : price;

  // Get the pending token from signup if user just signed up
  const pendingToken = typeof window !== 'undefined' ? sessionStorage.getItem('apx_pending_token') : null;
  const activeToken  = token || pendingToken;

  const handlePay = async () => {
    if (!activeToken) {
      router.push(`/signup?plan=${plan}&cycle=${cycle}`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050';
      const res = await fetch(`${API}/billing/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ plan, cycle, years: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Checkout failed');
      // Redirect to Stripe hosted checkout
      window.location.href = data.session_url;
    } catch (err: any) {
      setError(err.message || 'Could not start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="ai">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div className="stag">Checkout</div>
        <h1 style={{ fontSize: 32, fontFamily: 'var(--ffd)', fontWeight: 800, marginBottom: 10 }}>
          Complete your subscription
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text3)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>
          Review your plan and click Pay to be taken to secure Stripe checkout.
        </p>
      </div>

      {/* Plan summary */}
      <div className="card" style={{ marginBottom: 20, padding: '24px' }}>
        <div className="fxb" style={{ gap: 16, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', opacity: 0.55, marginBottom: 8 }}>Plan</div>
            <div style={{ fontSize: 26, fontFamily: 'var(--ffd)', fontWeight: 700, marginBottom: 4 }}>{sel.label}</div>
            <div style={{ fontSize: 14, color: 'var(--text3)' }}>{sel.summary}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6, lineHeight: 1.6 }}>{sel.blurb}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 38, fontFamily: 'var(--ffd)', fontWeight: 800 }}>{money.format(price)}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>/mo {cycle === 'annual' ? 'billed annually' : 'billed monthly'}</div>
          </div>
        </div>

        {/* Plan picker */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Change plan</div>
          <div className="g3" style={{ gap: 10 }}>
            {(Object.entries(planMeta) as [PlanId, typeof planMeta[PlanId]][]).map(([planId, meta]) => {
              const active = planId === plan;
              const p      = cycle === 'annual' ? meta.monthly * 0.9 : meta.monthly;
              return (
                <button
                  key={planId}
                  type="button"
                  onClick={() => router.replace(`/checkout?plan=${planId}&cycle=${cycle}`, { scroll: false })}
                  className="ch"
                  style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 'var(--rlg)', border: active ? '1.5px solid var(--accent)' : '1px solid var(--border)', background: active ? 'var(--accent)' : 'var(--surface)', color: active ? 'white' : 'var(--text)', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--ffd)', marginBottom: 4 }}>{meta.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--ffd)' }}>{money.format(p)}<span style={{ fontSize: 13, opacity: 0.7 }}>/mo</span></div>
                  <div style={{ fontSize: 12, opacity: active ? 0.85 : 0.6, marginTop: 4 }}>{meta.summary}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Billing cycle */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Billing cycle</div>
          <div className="tabs" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 4, width: 'fit-content' }}>
            {(['monthly', 'annual'] as Cycle[]).map(opt => (
              <button key={opt} type="button"
                className={`tab${cycle === opt ? ' act' : ''}`}
                onClick={() => router.replace(`/checkout?plan=${plan}&cycle=${opt}`, { scroll: false })}
                style={{ padding: '9px 18px', borderRadius: 999, textTransform: 'capitalize' }}
              >
                {opt === 'annual' ? 'Annual (save 10%)' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        {/* Due today */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', opacity: 0.55, marginBottom: 6 }}>Due today</div>
          <div style={{ fontSize: 32, fontFamily: 'var(--ffd)', fontWeight: 800, marginBottom: 4 }}>{money.format(dueToday)}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            {cycle === 'annual' ? `${money.format(price)}/mo equivalent, billed annually` : `${money.format(price)} billed every month`}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(192,57,43,.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {/* Pay button */}
      <button
        className="btn bp bfw"
        style={{ height: 52, justifyContent: 'center', fontSize: 16, fontWeight: 600, borderRadius: 14, marginBottom: 14 }}
        onClick={handlePay}
        disabled={loading}
      >
        {loading ? <Spin s={18} /> : (
          <><I n="lock" s={15} c="white" /> Pay {money.format(dueToday)} — Secure Stripe Checkout</>
        )}
      </button>

      <div className="fxc" style={{ justifyContent: 'center', gap: 8, fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
        <I n="shield" s={13} c="var(--green)" /> Powered by Stripe · SSL encrypted · Cancel anytime
      </div>

      {!activeToken && (
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
          Need an account first?{' '}
          <Link href={`/signup?plan=${plan}&cycle=${cycle}`} style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>Loading...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
