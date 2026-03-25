"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { I } from '@/components/Icons';
import { SBadge } from '@/components/ui/Shared';
import { useAuth } from '@/lib/auth';

interface SeedUrl { url: string; depth: number; }

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

function fmtMs(ms: number | null) {
  if (!ms) return '—';
  if (ms < 60000) return `${(ms/1000).toFixed(1)}s`;
  return `${Math.floor(ms/60000)}m ${Math.floor((ms%60000)/1000)}s`;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { token } = useAuth();

  const [tab,     setTab]     = useState('overview');
  const [project, setProject] = useState<any>(null);
  const [runs,    setRuns]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMsg,  setRunMsg]  = useState('');
  const [runOk,   setRunOk]   = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Settings form
  const [editName,   setEditName]   = useState('');
  const [seedUrls,   setSeedUrls]   = useState<SeedUrl[]>([{ url: '', depth: 3 }]);
  const [incPattern, setIncPattern] = useState('');
  const [excPattern, setExcPattern] = useState('');

  useEffect(() => {
    if (!token || !id) return;
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`/api/projects/${id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/projects/${id}/runs`, { headers: h }).then(r => r.json()),
    ]).then(([proj, runsData]) => {
      setProject(proj);
      setRuns(Array.isArray(runsData) ? runsData : []);
      setEditName(proj.name || '');
      const seeds = proj.seed_urls?.length
        ? proj.seed_urls
        : [{ url: proj.target_url || '', depth: proj.crawl_depth || 3 }];
      setSeedUrls(seeds);
      setIncPattern(proj.url_patterns_include || '');
      setExcPattern(proj.url_patterns_exclude || '');
    }).finally(() => setLoading(false));
  }, [token, id]);

  const handleRun = async () => {
    if (!token) return;
    setRunning(true); setRunMsg(''); setRunOk(false);
    try {
      const res  = await fetch(`/api/projects/${id}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = res.status === 503 ? 'Crawl service is temporarily unavailable. Please try again shortly.'
          : res.status === 409 ? 'A crawl is already running for this project.'
          : res.status === 403 ? 'Monthly page quota exhausted. Please upgrade your plan.'
          : 'Failed to start crawl. Please try again.';
        setRunMsg(msg); setRunOk(false);
      } else {
        setRunMsg('Crawl started! Check the Runs tab for progress.');
        setRunOk(true);
        setRuns(prev => [data, ...prev]);
      }
    } catch { setRunMsg('Could not connect. Please try again.'); setRunOk(false); }
    finally   { setRunning(false); }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const validUrls = seedUrls.filter(u => u.url.trim());
    if (!validUrls.length) { setSaveMsg('Add at least one URL'); return; }
    setSaveMsg('');
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        target_url: validUrls[0].url,
        seed_urls: validUrls,
        crawl_depth: validUrls[0].depth,
        url_patterns_include: incPattern || null,
        url_patterns_exclude: excPattern || null,
      }),
    });
    setSaveMsg(res.ok ? 'Changes saved' : 'Failed to save');
    if (res.ok) setProject((p: any) => ({ ...p, name: editName, seed_urls: validUrls }));
  };

  const archiveProject = async () => {
    if (!confirm('Archive this project? All scheduled runs will stop.')) return;
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });
    router.push('/projects');
  };

  const addUrl    = () => setSeedUrls(u => [...u, { url: '', depth: 3 }]);
  const removeUrl = (i: number) => setSeedUrls(u => u.filter((_, idx) => idx !== i));
  const updateUrl = (i: number, field: keyof SeedUrl, value: string | number) =>
    setSeedUrls(u => u.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  if (loading) return <><TopBar title="Loading..." back="projects" /><div className="pc"><div className="card sk" style={{ height: 200 }} /></div></>;
  if (!project || project.detail) return <><TopBar title="Not found" back="projects" /><div className="pc"><div className="card" style={{ padding: 32, color: 'var(--red)' }}>Project not found</div></div></>;

  const totalRuns   = runs.length;
  const successRuns = runs.filter(r => r.status === 'completed').length;
  const successRate = totalRuns > 0 ? ((successRuns / totalRuns) * 100).toFixed(1) : '—';
  const seedUrlList: SeedUrl[] = project.seed_urls?.length
    ? project.seed_urls
    : [{ url: project.target_url, depth: project.crawl_depth || 3 }];

  return (
    <>
      <TopBar
        title={project.name}
        sub={`${String(id).slice(0,8)} · ${seedUrlList.length} URL${seedUrlList.length !== 1 ? 's' : ''}`}
        back="projects"
        actions={
          <div className="fxc" style={{ gap: 8 }}>
            {runMsg && (
              <span style={{ fontSize: 12, color: runOk ? 'var(--green)' : 'var(--red)', maxWidth: 280 }}>
                {runMsg}
              </span>
            )}
            <button className="btn bp" onClick={handleRun} disabled={running}>
              <I n="refresh-cw" s={13} c="white" /> {running ? 'Starting...' : 'Crawl Now'}
            </button>
          </div>
        }
      />
      <div className="pc">
        <div className="tabs mb6" style={{ width: 'fit-content' }}>
          {['overview', 'runs', 'urls', 'settings'].map(t => (
            <button key={t} className={`tab${tab === t ? ' act' : ''}`}
              onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <>
            <div className="g3 mb6">
              <div className="card"><div className="fl" style={{ marginBottom: 6 }}>Pages Extracted</div><div style={{ fontFamily: 'var(--ffd)', fontSize: 28, fontWeight: 800 }}>{(project.pages_processed || 0).toLocaleString()}</div></div>
              <div className="card"><div className="fl" style={{ marginBottom: 6 }}>Total Runs</div><div style={{ fontFamily: 'var(--ffd)', fontSize: 28, fontWeight: 800 }}>{totalRuns}</div></div>
              <div className="card"><div className="fl" style={{ marginBottom: 6 }}>Success Rate</div><div style={{ fontFamily: 'var(--ffd)', fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>{successRate}{successRate !== '—' ? '%' : ''}</div></div>
            </div>
            <div className="g2 mb6">
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Configuration</h3>
                {[
                  ['Status',       <SBadge status={project.status} />],
                  ['Seed URLs',    `${seedUrlList.length} URL${seedUrlList.length !== 1 ? 's' : ''}`],
                  ['JS Rendering', project.js_rendering ? 'Enabled' : 'Disabled'],
                  ['Auto Chunking',project.auto_chunking ? 'Enabled' : 'Disabled'],
                  ['Chunk Size',   project.auto_chunking ? `${project.chunk_size} tokens` : '—'],
                  ['Vector DB',    project.vector_db !== 'none' ? project.vector_db : 'None'],
                  ['Schedule',     project.schedule_cron || 'Manual only'],
                ].map(([label, value]) => (
                  <div key={label as string} className="fxb" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text3)' }}>{label}</span>
                    <span style={{ fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Recent Runs</h3>
                {runs.slice(0, 5).length === 0 ? (
                  <div style={{ color: 'var(--text3)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No runs yet — click Crawl Now to start</div>
                ) : runs.slice(0, 5).map(r => (
                  <div key={r.id} className="fxb" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div className="fxc" style={{ gap: 8 }}><SBadge status={r.status} /><span style={{ color: 'var(--text3)' }}>{r.pages_processed} pages</span></div>
                    <span style={{ color: 'var(--text3)' }}>{timeAgo(r.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* RUNS */}
        {tab === 'runs' && (
          <div className="dtw">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Extraction Runs</h2>
            </div>
            {runs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)' }}>No runs yet</div>
            ) : (
              <table className="dt">
                <thead><tr><th>Run ID</th><th>Trigger</th><th>Status</th><th>Pages</th><th>Duration</th><th>Started</th></tr></thead>
                <tbody>
                  {runs.map(r => (
                    <tr key={r.id}>
                      <td className="mono" style={{ fontSize: 12 }}>{r.id?.slice(0,12)}...</td>
                      <td style={{ textTransform: 'capitalize' }}>{r.trigger}</td>
                      <td><SBadge status={r.status} /></td>
                      <td className="mono" style={{ fontSize: 13 }}>{(r.pages_processed || 0).toLocaleString()}</td>
                      <td className="mono" style={{ fontSize: 13 }}>{fmtMs(r.duration_ms)}</td>
                      <td style={{ color: 'var(--text3)' }}>{timeAgo(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* URLS TAB */}
        {tab === 'urls' && (
          <div style={{ maxWidth: 640 }}>
            <div className="card mb4">
              <div className="fxb" style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>Seed URLs ({seedUrlList.length})</h3>
                <button className="btn bs bsm" onClick={() => setTab('settings')}>Edit in Settings</button>
              </div>
              {seedUrlList.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text4)', flexShrink: 0 }}>{i+1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</div>
                    <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>
                      Depth: {item.depth >= 99 ? 'Unlimited' : item.depth}
                    </div>
                  </div>
                  <I n="link" s={13} c="var(--text4)" />
                </div>
              ))}
              {(project.url_patterns_include || project.url_patterns_exclude) && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  {project.url_patterns_include && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}><span style={{ fontWeight: 600, color: 'var(--green)' }}>Include: </span>{project.url_patterns_include}</div>}
                  {project.url_patterns_exclude && <div style={{ fontSize: 12, color: 'var(--text3)' }}><span style={{ fontWeight: 600, color: 'var(--red)' }}>Exclude: </span>{project.url_patterns_exclude}</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div style={{ maxWidth: 640 }}>
            <form className="fg" style={{ gap: 20 }} onSubmit={saveSettings}>
              {saveMsg && (
                <div style={{ background: saveMsg === 'Changes saved' ? 'var(--green-bg)' : 'var(--red-bg)', border: `1px solid ${saveMsg === 'Changes saved' ? 'rgba(26,122,79,.2)' : 'rgba(192,57,43,.2)'}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: saveMsg === 'Changes saved' ? 'var(--green)' : 'var(--red)' }}>{saveMsg}</div>
              )}

              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>General</h3>
                <div className="fg"><label className="fl">Project Name</label><input className="fi" value={editName} onChange={e => setEditName(e.target.value)} /></div>
              </div>

              <div className="card">
                <div className="fxb" style={{ marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600 }}>Seed URLs</h3>
                  <button type="button" className="btn bs bsm" onClick={addUrl}><I n="plus" s={12} /> Add URL</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {seedUrls.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 22, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text4)', flexShrink: 0 }}>{i+1}</div>
                      <input type="url" className="fi" placeholder="https://docs.example.com"
                        value={item.url} onChange={e => updateUrl(i, 'url', e.target.value)} style={{ flex: 1 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                        <label style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', paddingLeft: 2 }}>Depth</label>
                        <select className="fse" value={item.depth} onChange={e => updateUrl(i, 'depth', parseInt(e.target.value))} style={{ width: 110 }}>
                          <option value={1}>1 — Page only</option>
                          <option value={2}>2 — Direct links</option>
                          <option value={3}>3 — Recommended</option>
                          <option value={5}>5 — Deep</option>
                          <option value={10}>10 — Very deep</option>
                          <option value={99}>Unlimited</option>
                        </select>
                      </div>
                      {seedUrls.length > 1 && (
                        <button type="button" className="btn bg2btn" onClick={() => removeUrl(i)}
                          style={{ padding: '8px', height: 38, flexShrink: 0, marginTop: 16 }}>
                          <I n="x" s={13} c="var(--red)" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>URL Filters</h3>
                <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>Comma-separated path patterns to include or exclude.</p>
                <div className="fg" style={{ gap: 14 }}>
                  <div className="fg"><label className="fl">Include only</label><input className="fi" placeholder="/docs, /api" value={incPattern} onChange={e => setIncPattern(e.target.value)} /></div>
                  <div className="fg"><label className="fl">Exclude</label><input className="fi" placeholder="/blog, /login" value={excPattern} onChange={e => setExcPattern(e.target.value)} /></div>
                </div>
              </div>

              <button type="submit" className="btn bp" style={{ alignSelf: 'flex-start' }}>Save Changes</button>
            </form>

            <div className="card" style={{ marginTop: 20, border: '1px solid rgba(192,57,43,.2)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)', marginBottom: 6 }}>Danger Zone</h3>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>Archiving stops all scheduled runs and removes the project from your active list.</p>
              <button type="button" className="btn bdn bsm" onClick={archiveProject}>Archive Project</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}