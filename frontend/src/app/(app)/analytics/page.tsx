"use client";
import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { useAuth } from '@/lib/auth';

function fmtMs(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AnalyticsPage() {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/analytics?range=${range}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [token, range]);

  return (
    <>
      <TopBar title="Analytics" sub="Usage and extraction metrics" actions={
        <div className="tabs">
          {['24h', '7d', '30d'].map(t => (
            <button key={t} className={`tab${range === t ? ' act' : ''}`} onClick={() => setRange(t)}>{t}</button>
          ))}
        </div>
      } />
      <div className="pc">
        {loading ? (
          <div className="g3 mb6">{[1,2,3].map(i => <div key={i} className="card sk" style={{ height: 80 }} />)}</div>
        ) : (
          <>
            <div className="g3 mb6">
              <div className="card">
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>Pages Extracted</div>
                <div style={{ fontFamily: 'var(--ffd)', fontSize: 28, fontWeight: 800 }}>{(data?.pages_extracted || 0).toLocaleString()}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>Compute Time</div>
                <div style={{ fontFamily: 'var(--ffd)', fontSize: 28, fontWeight: 800 }}>{data?.compute_time_ms ? fmtMs(data.compute_time_ms) : '—'}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>Success Rate</div>
                <div style={{ fontFamily: 'var(--ffd)', fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>
                  {data?.success_rate != null ? `${(data.success_rate * 100).toFixed(1)}%` : '—'}
                </div>
              </div>
            </div>
            <div className="card mb6">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Pages Over Time</h3>
              {data?.chart && data.chart.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, padding: '0 4px' }}>
                  {data.chart.map((d: any) => {
                    const max = Math.max(...data.chart.map((x: any) => x.pages));
                    const pct = max > 0 ? (d.pages / max) * 100 : 0;
                    return (
                      <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 10, color: 'var(--text4)' }}>{d.pages > 0 ? d.pages.toLocaleString() : ''}</div>
                        <div style={{ width: '100%', background: 'var(--accent)', borderRadius: 4, height: `${Math.max(pct, 2)}%`, minHeight: 3 }} />
                        <div style={{ fontSize: 9, color: 'var(--text4)', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{d.date?.slice(5)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
                  No data for this period
                </div>
              )}
            </div>
            <div className="card">
              <div className="fxb" style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>Summary</h3>
              </div>
              {[
                ['Total runs', data?.total_runs || 0],
                ['Failed runs', data?.failed_runs || 0],
                ['Pages extracted', (data?.pages_extracted || 0).toLocaleString()],
                ['Success rate', data?.success_rate != null ? `${(data.success_rate * 100).toFixed(1)}%` : '—'],
              ].map(([l, v]) => (
                <div key={l as string} className="fxb" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text3)' }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}