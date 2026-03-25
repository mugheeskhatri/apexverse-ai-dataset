"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { I } from '@/components/Icons';
import { SBadge } from '@/components/ui/Shared';
import { useAuth } from '@/lib/auth';

function timeAgo(iso: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setProjects(Array.isArray(data) ? data : []); })
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = projects.filter(p =>
    p.name?.toLowerCase().includes(term.toLowerCase()) ||
    p.target_url?.toLowerCase().includes(term.toLowerCase())
  );

  return (
    <>
      <TopBar title="Projects" sub="Manage your extraction targets and settings" actions={
        <button className="btn bp" onClick={() => router.push('/create-project')}>
          <I n="plus" s={14} c="white" /> New Project
        </button>
      } />
      <div className="pc">
        <div className="fxb mb4" style={{ gap: 16 }}>
          <div className="rel" style={{ maxWidth: 320, width: '100%' }}>
            <div style={{ position: 'absolute', top: 10, left: 12 }}><I n="search" s={15} c="var(--text4)" /></div>
            <input className="fi" placeholder="Search projects..." value={term} onChange={e => setTerm(e.target.value)} style={{ paddingLeft: 34 }} />
          </div>
        </div>
        {loading ? (
          <div className="dtw"><div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading...</div></div>
        ) : error ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--red)' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <I n="folder" s={32} c="var(--border)" />
            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>No projects yet</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Create your first project to start extracting content</div>
            <button className="btn bp" style={{ marginTop: 16 }} onClick={() => router.push('/create-project')}>
              <I n="plus" s={13} c="white" /> Create project
            </button>
          </div>
        ) : (
          <div className="dtw">
            <table className="dt">
              <thead><tr><th>Project Name</th><th>Target URL</th><th>Status</th><th>Pages</th><th>JS Rendering</th><th>Vector DB</th><th>Last Updated</th><th style={{ width: 40 }}></th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/projects/${p.id}`)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text4)', fontFamily: 'var(--ffm)' }}>{p.id?.slice(0, 8)}...</div>
                    </td>
                    <td><div className="fxc" style={{ gap: 6, color: 'var(--text3)' }}><I n="link" s={13} />{p.target_url?.replace(/^https?:\/\//, '')}</div></td>
                    <td><SBadge status={p.status} /></td>
                    <td className="mono" style={{ fontSize: 13 }}>{(p.pages_processed || 0).toLocaleString()}</td>
                    <td>{p.js_rendering ? <span className="fxc" style={{ gap: 5, color: 'var(--blue)', fontSize: 13 }}><I n="cpu" s={13} /> Enabled</span> : <span style={{ color: 'var(--text4)' }}>Disabled</span>}</td>
                    <td><div className="fxc" style={{ gap: 6 }}><I n={p.vector_db && p.vector_db !== 'none' ? 'database' : 'minus'} s={13} c="var(--text3)" /><span style={!p.vector_db || p.vector_db === 'none' ? { color: 'var(--text4)' } : {}}>{p.vector_db && p.vector_db !== 'none' ? p.vector_db : '—'}</span></div></td>
                    <td style={{ color: 'var(--text3)' }}>{timeAgo(p.updated_at)}</td>
                    <td><button className="btn bg2btn" onClick={e => { e.stopPropagation(); router.push(`/projects/${p.id}`); }} style={{ padding: 6, width: 28, height: 28 }}><I n="arrow-right" s={14} c="var(--text3)" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}