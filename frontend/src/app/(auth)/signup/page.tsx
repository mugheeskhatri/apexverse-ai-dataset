"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spin } from '@/components/Icons';
import { useAuth } from '@/lib/auth';

const planMeta: Record<string, { label: string; monthly: number }> = {
  starter:      { label: 'Starter',      monthly: 19  },
  growth:       { label: 'Growth',       monthly: 59  },
  professional: { label: 'Professional', monthly: 149 },
};

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();

  const [plan,     setPlan]     = useState(searchParams.get('plan')  || 'starter');
  const [cycle,    setCycle]    = useState<'monthly'|'annual'>((searchParams.get('cycle') as any) || 'monthly');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const selectedPlan  = planMeta[plan] || planMeta.starter;
  const selectedPrice = cycle === 'annual' ? Math.round(selectedPlan.monthly * 0.9) : selectedPlan.monthly;
  const checkoutHref  = `/checkout?plan=${plan}&cycle=${cycle}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password);
      // Account created — now go to checkout to pay
      router.push(checkoutHref);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontFamily: 'var(--ffd)', fontWeight: 800, marginBottom: 8 }}>Create an account</h1>
        <p style={{ fontSize: 14, color: 'var(--text3)' }}>Sign up, choose your plan, and complete secure checkout.</p>
      </div>

      <div className="card">
        {/* Plan selector */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 18 }}>
          <div className="fxb" style={{ gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Selected plan</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>${selectedPrice}/mo {cycle === 'annual' ? 'billed annually' : 'billed monthly'}</div>
            </div>
            <span className="badge bggr" style={{ padding: '4px 10px' }}>{selectedPlan.label}</span>
          </div>
          <div className="g2" style={{ gap: 12 }}>
            <div className="fg">
              <label className="fl">Plan</label>
              <select className="fse" value={plan} onChange={e => setPlan(e.target.value)}>
                <option value="starter">Starter — $19/mo</option>
                <option value="growth">Growth — $59/mo</option>
                <option value="professional">Professional — $149/mo</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Billing</label>
              <select className="fse" value={cycle} onChange={e => setCycle(e.target.value as any)}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual (save 10%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Google OAuth */}
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://72.61.7.93:8000'}/auth/google`}
          className="btn bs bfw mb4"
          style={{ justifyContent: 'center', height: 42, textDecoration: 'none', display: 'flex', alignItems: 'center' }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: 8 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.04 5.04 0 01-2.19 3.3v2.73h3.55c2.08-1.92 3.28-4.74 3.28-8.04z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.73c-.98.66-2.23 1.05-3.73 1.05-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.13A6.99 6.99 0 015.48 12c0-.74.13-1.46.36-2.13V7.03H2.18A10.97 10.97 0 001 12c0 1.77.42 3.45 1.18 4.97l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.66 2.84c.86-2.59 3.29-4.49 6.16-4.49z"/>
          </svg>
          Sign up with Google
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Error message */}
        {error && (
          <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(192,57,43,.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {/* Email form */}
        <form className="fg" style={{ gap: 14 }} onSubmit={handleSubmit}>
          <div className="fg">
            <label className="fl">Full Name</label>
            <input required className="fi" placeholder="Jane Doe" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Work Email</label>
            <input type="email" required className="fi" placeholder="name@company.com" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Password</label>
            <input
              type="password"
              required
              className="fi"
              placeholder="Min 8 characters"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button className="btn bp bfw mt2" style={{ height: 42 }} disabled={loading}>
            {loading ? <Spin s={16} /> : 'Create account and choose plan'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text3)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
