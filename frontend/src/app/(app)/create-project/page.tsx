"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { I } from '@/components/Icons';
import { useAuth } from '@/lib/auth';

interface SeedUrl { url: string; depth: number; }

export default function CreateProject() {
  const router = useRouter();
  const { token } = useAuth();

  const [name,        setName]        = useState('');
  const [seedUrls,    setSeedUrls]    = useState<SeedUrl[]>([{ url: '', depth: 3 }]);
  const [incPattern,  setIncPattern]  = useState('');
  const [excPattern,  setExcPattern]  = useState('');
  const [jsRendering, setJsRendering] = useState(false);
  const [autoChunking,setAutoChunking]= useState(true);
  const [chunkSize,   setChunkSize]   = useState(512);
  const [chunkOverlap,setChunkOverlap]= useState(50);
  const [vectorDb,    setVectorDb]    = useState('none');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const addUrl    = () => setSeedUrls(u => [...u, { url: '', depth: 3 }]);
  const removeUrl = (i: number) => setSeedUrls(u => u.filter((_, idx) => idx !== i));
  const updateUrl = (i: number, field: keyof SeedUrl, value: string | number) =>
    setSeedUrls(u => u.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validUrls = seedUrls.filter(u => u.url.trim());
    if (!validUrls.length) { setError('Add at least one URL'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          target_url: validUrls[0].url,
          seed_urls: validUrls,
          crawl_depth: validUrls[0].depth,
          url_patterns_include: incPattern || null,
          url_patterns_exclude: excPattern || null,
          js_rendering: jsRendering,
          auto_chunking: autoChunking,
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap,
          vector_db: vectorDb,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Failed to create project'); return; }
      router.push(`/projects/${data.id}`);
    } catch { setError('Failed to connect. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <TopBar title="New Project" back="projects" />
      <div className="pc" style={{ maxWidth: 680, margin: '0 auto' }}>
        {error && <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(192,57,43,.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>{error}</div>}
        <form className="fg" style={{ gap: 24 }} onSubmit={handleSubmit}>

          <div className="fg">
            <label className="fl">Project Name</label>
            <input required className="fi" placeholder="My Knowledge Base" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Seed URLs */}
          <div className="fg">
            <div className="fxb" style={{ marginBottom: 8 }}>
              <label className="fl" style={{ marginBottom: 0 }}>
                Seed URLs
                <span style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 400, marginLeft: 6 }}>
                  Each URL is crawled independently to its specified depth
                </span>
              </label>
              <button type="button" className="btn bs bsm" onClick={addUrl}>
                <I n="plus" s={12} /> Add URL
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {seedUrls.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text4)', flexShrink: 0 }}>{i+1}</div>
                  <input required={i === 0} type="url" className="fi"
                    placeholder="https://docs.example.com"
                    value={item.url} onChange={e => updateUrl(i, 'url', e.target.value)}
                    style={{ flex: 1 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                    <label style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', paddingLeft: 2 }}>Depth</label>
                    <select className="fse" value={item.depth}
                      onChange={e => updateUrl(i, 'depth', parseInt(e.target.value))}
                      style={{ width: 110 }}>
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
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginTop: 8, fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text2)' }}>Depth:</strong> 1 = page only · 2 = page + its links · 3 = recommended · Unlimited = entire site
            </div>
          </div>

          {/* URL Filters */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>URL Filters <span style={{ fontSize: 12, color: 'var(--text4)', fontWeight: 400 }}>Optional</span></h3>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>Comma-separated path patterns to restrict crawling.</p>
            <div className="g2" style={{ gap: 14 }}>
              <div className="fg">
                <label className="fl">Include only</label>
                <input className="fi" placeholder="/docs, /api, /guide" value={incPattern} onChange={e => setIncPattern(e.target.value)} />
              </div>
              <div className="fg">
                <label className="fl">Exclude</label>
                <input className="fi" placeholder="/blog, /careers, /login" value={excPattern} onChange={e => setExcPattern(e.target.value)} />
              </div>
            </div>
          </div>

          {/* JS Rendering + Auto-Chunking */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="fxb ptr" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }} onClick={() => setJsRendering(!jsRendering)}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>JavaScript Rendering</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>Use headless browser for React/Vue/Angular SPAs.</div>
              </div>
              <label className="tog" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={jsRendering} onChange={e => setJsRendering(e.target.checked)} />
                <span className="tsl" />
              </label>
            </div>
            <div className="fxb ptr" style={{ padding: '16px 20px' }} onClick={() => setAutoChunking(!autoChunking)}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Auto-Chunking</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>Split extracted text into RAG-optimal chunks.</div>
              </div>
              <label className="tog" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={autoChunking} onChange={e => setAutoChunking(e.target.checked)} />
                <span className="tsl" />
              </label>
            </div>
          </div>

          {autoChunking && (
            <div className="card g2" style={{ gap: 16 }}>
              <div className="fg">
                <label className="fl">Chunk Size (Tokens)</label>
                <select className="fse" value={chunkSize} onChange={e => setChunkSize(parseInt(e.target.value))}>
                  <option value={256}>256 — Small, precise</option>
                  <option value={512}>512 — Recommended</option>
                  <option value={1024}>1024 — Large context</option>
                  <option value={2048}>2048 — Maximum</option>
                </select>
              </div>
              <div className="fg">
                <label className="fl">Overlap (Tokens)</label>
                <select className="fse" value={chunkOverlap} onChange={e => setChunkOverlap(parseInt(e.target.value))}>
                  <option value={50}>50 — Minimal</option>
                  <option value={100}>100 — Recommended</option>
                  <option value={200}>200 — High overlap</option>
                </select>
              </div>
            </div>
          )}

          <div className="fg">
            <label className="fl">Vector Database <span className="badge bggr">Professional+</span></label>
            <select className="fse" value={vectorDb} onChange={e => setVectorDb(e.target.value)}>
              <option value="none">None — Export files only</option>
              <option value="pinecone">Pinecone</option>
              <option value="qdrant">Qdrant</option>
              <option value="weaviate">Weaviate</option>
              <option value="pgvector">PGVector</option>
              <option value="milvus">Milvus</option>
              <option value="azure_ai">Azure AI Search</option>
            </select>
          </div>

          <div className="fxc" style={{ justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn bs" onClick={() => router.back()}>Cancel</button>
            <button type="submit" className="btn bp" disabled={loading}>
              {loading ? 'Creating...' : `Create Project${seedUrls.filter(u => u.url).length > 1 ? ` (${seedUrls.filter(u => u.url).length} URLs)` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}