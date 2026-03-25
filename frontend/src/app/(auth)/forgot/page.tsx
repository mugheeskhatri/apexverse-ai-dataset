"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { I, Spin } from '@/components/Icons';

export default function ForgotPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <div className="ai">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontFamily: 'var(--ffd)', fontWeight: 800, marginBottom: 8 }}>Reset your password</h1>
        <p style={{ fontSize: 14, color: 'var(--text3)' }}>We&apos;ll send you instructions to reset your password.</p>
      </div>
      <div className="card">
        {sent ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: 44, height: 44, background: 'var(--green-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><I n="check" s={22} c="var(--green)" /></div>
            <h2 style={{ fontSize: 16, marginBottom: 8 }}>Check your email</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>We&apos;ve sent a password reset link to your email address.</p>
          </div>
        ) : (
          <form className="fg" style={{ gap: 14 }} onSubmit={e => { e.preventDefault(); setLoading(true); setTimeout(() => setSent(true), 800); }}>
            <div className="fg"><label className="fl">Email</label><input type="email" required className="fi" placeholder="name@company.com" /></div>
            <button className="btn bp bfw mt2" style={{ height: 42 }} disabled={loading}>
              {loading ? <Spin s={16} /> : 'Send instructions'}
            </button>
          </form>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13 }}>
        <Link href="/login" style={{ color: 'var(--text3)', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}><I n="arrow-left" s={13} /> Back to log in</Link>
      </div>
    </div>
  );
}
