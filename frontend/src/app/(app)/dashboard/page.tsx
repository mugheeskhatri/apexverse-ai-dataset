"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { I } from '@/components/Icons';
import { SBadge } from '@/components/ui/Shared';
import { useAuth } from '@/lib/auth';

interface DashboardData {
  pages_used: number;
  page_quota: number;
  usage_pct: number;
  active_projects: number;
  avg_extraction_time_ms: number;
  plan: string | null;
  recent_runs: Array<{
    id: string;
    project_id: string;
    status: string;
    pages_processed: number;
    duration_ms: number | null;
    finished_at: string | null;
    created_at: string;
  }>;
}

interface SubData {
  has_subscription: boolean;
  plan?: string;
  status?: string;
  page_quota?: number;
  pages_used?: number;
  usage_pct?: number;
  current_period_end?: string;
}

function timeAgo(iso: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDuration(ms: number | null) {
  if (!ms) return '—';
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [sub,     setSub]     = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/dashboard',             { headers }).then(r => r.json()),
      fetch('/api/billing/subscription',  { headers }).then(r => r.json()),
    ])
      .then(([dashData, subData]) => {
        // If no active subscription → redirect to checkout
        if (subData.has_subscription === false || !['active','trialing'].includes(subData.status)) {
          router.replace('/checkout');
          return;
        }
        setData(dashData);
        setSub(subData);
      })
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [token, router]);

  if (loading) return (
    <>
      <TopBar title="Dashboard" sub="Loading your workspace..." />
      <div className="pc">
        <div className="g3 mb6">
          {[1,2,3].map(i => <div key={i} className="card sk" style={{ height: 96 }} />)}
        </div>
        <div className="card sk" style={{ height: 220 }} />
      </div>
    </>
  );

  if (error) return (
    <>
      <TopBar title="Dashboard" />
      <div className="pc">
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--red)' }}>{error}</div>
      </div>
    </>
  );

  const usagePct = sub?.usage_pct ?? 0;
  const usageColor = usagePct >= 90 ? 'var(--red)' : usagePct >= 70 ? 'var(--yellow)' : 'var(--green)';

  return (
    <>
      <TopBar
        title="Dashboard"
        sub={`${sub?.plan ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) + ' Plan' : ''} — Overview of your extraction pipelines`}
        actions={
          <button className="btn bp" onClick={() => router.push('/create-project')}>
            <I n="plus" s={14} c="white" /> New Project
          </button>
        }
      />
      <div className="pc">

        {/* Subscription status banner — show if quota > 80% */}
        {usagePct >= 80 && (
          <div style={{ background: usagePct >= 100 ? 'var(--red-bg)' : 'var(--yellow-bg)', border: `1px solid ${usagePct >= 100 ? 'rgba(192,57,43,.2)' : 'rgba(184,110,0,.2)'}`, borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div className="fxc" style={{ gap: 8 }}>
              <I n={usagePct >= 100 ? 'alert-circle' : 'alert-triangle'} s={15} c={usagePct >= 100 ? 'var(--red)' : 'var(--yellow)'} />
              <span style={{ fontSize: 13, fontWeight: 600, color: usagePct >= 100 ? 'var(--red)' : 'var(--yellow)' }}>
                {usagePct >= 100 ? 'Page quota exhausted — crawls paused' : `${usagePct}% of monthly quota used`}
              </span>
            </div>
            <button className="btn bp bsm" onClick={() => router.push('/billing')}>Upgrade plan</button>
          </div>
        )}

        {/* Stats */}
        <div className="g3 mb6">
          <div className="card ch">
            <div className="fxb mb3">
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Pages used this month</h3>
              <I n="layers" s={14} c="var(--text4)" />
            </div>
            <div style={{ fontFamily: 'var(--ffd)', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
              {(data?.pages_used ?? 0).toLocaleString()}
            </div>
            <div style={{ marginBottom: 6 }}>
              <div className="pb" style={{ height: 5, borderRadius: 3 }}>
                <div className="pf" style={{ width: `${Math.min(usagePct, 100)}%`, background: usageColor, borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {usagePct}% of {(sub?.page_quota ?? 0).toLocaleString()} pages
            </div>
          </div>

          <div className="card ch">
            <div className="fxb mb3">
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Active projects</h3>
              <I n="folder" s={14} c="var(--text4)" />
            </div>
            <div style={{ fontFamily: 'var(--ffd)', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
              {data?.active_projects ?? 0}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {sub?.plan === 'starter' ? '2 max' : sub?.plan === 'growth' ? '5 max' : sub?.plan === 'professional' ? '20 max' : ''} on {sub?.plan} plan
            </div>
          </div>

          <div className="card ch">
            <div className="fxb mb3">
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Avg extraction time</h3>
              <I n="zap" s={14} c="var(--text4)" />
            </div>
            <div style={{ fontFamily: 'var(--ffd)', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
              {data?.avg_extraction_time_ms ? fmtDuration(data.avg_extraction_time_ms) : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {sub?.current_period_end ? `Resets ${timeAgo(sub.current_period_end).replace(' ago', '')}` : 'No runs yet'}
            </div>
          </div>
        </div>

        {/* Recent runs */}
        <div className="dtw mb6">
          <div className="fxb" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Recent Extraction Runs</h2>
            <button className="btn bg2btn bsm" onClick={() => router.push('/analytics')}>View all</button>
          </div>
          {(!data?.recent_runs || data.recent_runs.length === 0) ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text3)' }}>
              <I n="layers" s={32} c="var(--border)" />
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>No runs yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Create a project and trigger your first crawl</div>
              <button className="btn bp" style={{ marginTop: 16 }} onClick={() => router.push('/create-project')}>
                <I n="plus" s={13} c="white" /> Create project
              </button>
            </div>
          ) : (
            <table className="dt">
              <thead>
                <tr><th>Project</th><th>Status</th><th>Pages</th><th>Duration</th><th>Finished</th></tr>
              </thead>
              <tbody>
                {data.recent_runs.map(run => (
                  <tr key={run.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/projects/${run.project_id}`)}>
                    <td><div style={{ fontWeight: 500, fontFamily: 'var(--ffm)', fontSize: 12, color: 'var(--text3)' }}>{run.project_id.slice(0, 8)}...</div></td>
                    <td><SBadge status={run.status} /></td>
                    <td className="mono" style={{ fontSize: 13 }}>{run.pages_processed.toLocaleString()}</td>
                    <td className="mono" style={{ fontSize: 13 }}>{fmtDuration(run.duration_ms)}</td>
                    <td style={{ color: 'var(--text3)' }}>{timeAgo(run.finished_at || run.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick links */}
        <div className="g2">
          <div className="card ch ptr" onClick={() => router.push('/create-project')} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, background: 'var(--brand-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <I n="plus" s={20} c="var(--brand)" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>Create a project</h3>
              <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>Add a target URL, configure crawl settings, and start extracting content.</p>
            </div>
          </div>
          <div className="card ch ptr" onClick={() => router.push('/billing')} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, background: 'var(--blue-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <I n="credit-card" s={20} c="var(--blue)" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>Billing & usage</h3>
              <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
                {sub?.plan ? `${sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)} plan · ${(sub.pages_used ?? 0).toLocaleString()} / ${(sub.page_quota ?? 0).toLocaleString()} pages used` : 'View your plan and usage'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
