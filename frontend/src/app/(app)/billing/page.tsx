"use client";
import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { I } from '@/components/Icons';
import { useAuth } from '@/lib/auth';

const PLAN_PRICES: Record<string, number> = { starter: 19, growth: 59, professional: 149 };

export default function BillingPage() {
  const { token } = useAuth();
  const [sub, setSub] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/billing/subscription', { headers: h }).then(r => r.json()),
      fetch('/api/billing/invoices',     { headers: h }).then(r => r.json()),
    ]).then(([s, inv]) => {
      setSub(s);
      setInvoices(Array.isArray(inv) ? inv : []);
    }).finally(() => setLoading(false));
  }, [token]);

  const handlePortal = async () => {
    const res = await fetch('/api/billing/portal', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will retain access until the end of the billing period.')) return;
    setCanceling(true);
    const res = await fetch('/api/billing/cancel', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    const data = await res.json();
    setMsg(data.message || 'Subscription canceled');
    setCanceling(false);
  };

  const pct = sub ? Math.round((sub.pages_used / sub.page_quota) * 100) : 0;
  const pColor = pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--yellow)' : 'var(--accent)';

  return (
    <>
      <TopBar title="Billing & Usage" sub="Manage your subscription and usage" />
      <div className="pc" style={{ maxWidth: 840, margin: '0 auto' }}>
        {loading ? (
          <div className="card sk" style={{ height: 160, marginBottom: 24 }} />
        ) : (
          <>
            {msg && <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(26,122,79,.2)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: 'var(--green)' }}>{msg}</div>}
            <div className="card mb6">
              <div className="fxb mb4" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                    {sub?.plan ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) : 'No'} Plan
                    <span className={`badge ${sub?.status === 'active' ? 'bgg' : 'bgr2'}`} style={{ marginLeft: 8 }}>
                      {sub?.status || 'inactive'}
                    </span>
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                    ${PLAN_PRICES[sub?.plan] || 0}/month · {sub?.cycle === 'annual' ? 'Billed annually' : 'Billed monthly'}
                    {sub?.current_period_end && ` · Renews ${new Date(sub.current_period_end).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="fxc" style={{ gap: 8 }}>
                  <button className="btn bs bsm" onClick={handlePortal}>Manage in Stripe</button>
                </div>
              </div>
              <div style={{ background: 'var(--bg2)', padding: '16px 20px', borderRadius: 'var(--r)' }}>
                <div className="fxb mb2">
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Monthly Page Quota</span>
                  <span className="mono" style={{ fontSize: 13 }}>{(sub?.pages_used || 0).toLocaleString()} / {(sub?.page_quota || 0).toLocaleString()}</span>
                </div>
                <div className="pb mb2" style={{ height: 8, borderRadius: 4 }}>
                  <div className="pf" style={{ width: `${Math.min(pct, 100)}%`, background: pColor, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {pct}% used
                  {pct > 90 && <span style={{ color: 'var(--red)', fontWeight: 600, marginLeft: 8 }}>⚠ Approaching limit</span>}
                </div>
              </div>
              {sub?.status === 'active' && !sub?.canceled_at && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <button className="btn bdn bsm" onClick={handleCancel} disabled={canceling}>
                    {canceling ? 'Canceling...' : 'Cancel subscription'}
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--text4)', marginLeft: 12 }}>You keep access until end of billing period</span>
                </div>
              )}
            </div>

            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Billing History</h2>
            <div className="dtw">
              {invoices.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No invoices yet</div>
              ) : (
                <table className="dt">
                  <thead><tr><th>Receipt</th><th>Date</th><th>Amount</th><th>Status</th><th /></tr></thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id}>
                        <td className="mono" style={{ fontSize: 12 }}>{inv.receipt_number}</td>
                        <td style={{ fontSize: 13 }}>{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '—'}</td>
                        <td className="mono" style={{ fontSize: 13 }}>${(inv.amount / 1).toFixed(2)}</td>
                        <td><span className={`badge ${inv.status === 'paid' ? 'bgg' : 'bgr2'}`}>{inv.status}</span></td>
                        <td>{inv.pdf_url && <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="btn bg2btn bsm"><I n="download" s={13} /></a>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}