"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { I } from '@/components/Icons';
import { useAuth } from '@/lib/auth';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { setTokenFromCheckout } = useAuth();
  const [activating, setActivating] = useState(true);

  useEffect(() => {
    // Pull the pending token saved during signup and activate the session
    const pendingToken = sessionStorage.getItem('apx_pending_token');
    const pendingUser  = sessionStorage.getItem('apx_pending_user');

    if (pendingToken && pendingUser) {
      setTokenFromCheckout(pendingToken, JSON.parse(pendingUser));
      sessionStorage.removeItem('apx_pending_token');
      sessionStorage.removeItem('apx_pending_user');
    }
    setActivating(false);
  }, [setTokenFromCheckout]);

  const sessionId = searchParams.get('session_id');

  return (
    <div className="ai">
      <div className="card" style={{ marginBottom: 20, padding: '34px 32px 30px', textAlign: 'center' }}>
        <div style={{ width: 68, height: 68, borderRadius: 22, background: 'var(--green-bg)', border: '1px solid rgba(26,122,79,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <I n="check-circle" s={30} c="var(--green)" />
        </div>
        <div className="stag" style={{ marginBottom: 10 }}>Payment Confirmed</div>
        <h1 style={{ fontSize: 30, fontFamily: 'var(--ffd)', fontWeight: 800, marginBottom: 12 }}>
          Subscription activated!
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text3)', lineHeight: 1.8, maxWidth: 500, margin: '0 auto 24px' }}>
          Your workspace is ready. Click below to go to your dashboard and start your first crawl.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto' }}>
          <Link
            href="/dashboard"
            className="btn bp bfw"
            style={{ justifyContent: 'center', textDecoration: 'none', height: 46 }}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/billing"
            className="btn bs bfw"
            style={{ justifyContent: 'center', textDecoration: 'none' }}
          >
            View billing
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Workspace is active and ready to use',
            'A confirmation has been sent to your billing email',
            'Manage your subscription anytime from the Billing page',
          ].map(item => (
            <div key={item} className="fxc" style={{ gap: 10 }}>
              <I n="check" s={14} c="var(--green)" />
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{item}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
