"use client";
import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { I } from '@/components/Icons';
import { useAuth } from '@/lib/auth';

export default function SettingsPage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState('');
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    fetch('/api/settings/profile',  { headers: h }).then(r => r.json()).then(setProfile);
    fetch('/api/settings/api-keys', { headers: h }).then(r => r.json()).then(d => setApiKeys(Array.isArray(d) ? d : []));
  }, [token]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    const res = await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profile.name, company: profile.company, phone: profile.phone }),
    });
    setMsg(res.ok ? 'Profile saved' : 'Failed to save');
    setSaving(false);
  };

  const generateKey = async () => {
    const res = await fetch('/api/settings/api-keys', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (data.key) { setNewKey(data.key); setApiKeys(prev => [...prev, data]); }
  };

  const revokeKey = async (id: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    await fetch(`/api/settings/api-keys/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { setPwMsg('Passwords do not match'); return; }
    const res = await fetch('/api/settings/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
    });
    const data = await res.json();
    setPwMsg(res.ok ? 'Password changed' : (data.detail || 'Failed'));
    if (res.ok) setPwForm({ current_password: '', new_password: '', confirm: '' });
  };

  return (
    <>
      <TopBar title="Settings" sub="Account and workspace preferences" />
      <div className="pc" style={{ maxWidth: 640, margin: '0 auto' }}>

        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Profile</h2>
        <div className="card mb6">
          {msg && <div style={{ background: msg.includes('saved') ? 'var(--green-bg)' : 'var(--red-bg)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: msg.includes('saved') ? 'var(--green)' : 'var(--red)' }}>{msg}</div>}
          <form className="fg" style={{ gap: 16 }} onSubmit={saveProfile}>
            <div className="fg"><label className="fl">Full Name</label><input className="fi" value={profile?.name || ''} onChange={e => setProfile((p: any) => ({...p, name: e.target.value}))} /></div>
            <div className="fg"><label className="fl">Email</label><input className="fi" value={profile?.email || ''} disabled /></div>
            <div className="fg"><label className="fl">Company</label><input className="fi" value={profile?.company || ''} onChange={e => setProfile((p: any) => ({...p, company: e.target.value}))} /></div>
            <div className="fg"><label className="fl">Phone</label><input className="fi" value={profile?.phone || ''} onChange={e => setProfile((p: any) => ({...p, phone: e.target.value}))} /></div>
            <button className="btn bp" style={{ alignSelf: 'flex-start' }} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
          </form>
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Change Password</h2>
        <div className="card mb6">
          {pwMsg && <div style={{ background: pwMsg.includes('changed') ? 'var(--green-bg)' : 'var(--red-bg)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: pwMsg.includes('changed') ? 'var(--green)' : 'var(--red)' }}>{pwMsg}</div>}
          <form className="fg" style={{ gap: 14 }} onSubmit={changePassword}>
            <div className="fg"><label className="fl">Current Password</label><input type="password" className="fi" autoComplete="current-password" value={pwForm.current_password} onChange={e => setPwForm(p => ({...p, current_password: e.target.value}))} /></div>
            <div className="fg"><label className="fl">New Password</label><input type="password" className="fi" autoComplete="new-password" value={pwForm.new_password} onChange={e => setPwForm(p => ({...p, new_password: e.target.value}))} /></div>
            <div className="fg"><label className="fl">Confirm New Password</label><input type="password" className="fi" autoComplete="new-password" value={pwForm.confirm} onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))} /></div>
            <button className="btn bs" style={{ alignSelf: 'flex-start' }}>Change Password</button>
          </form>
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>API Keys</h2>
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Use these keys to authenticate API requests from your own code. Never share them publicly.</p>
          {newKey && (
            <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(26,122,79,.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>New API Key — copy it now, it will not be shown again</div>
              <code style={{ fontSize: 12, fontFamily: 'var(--ffm)', wordBreak: 'break-all' }}>{newKey}</code>
            </div>
          )}
          {apiKeys.length > 0 && (
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {apiKeys.map(k => (
                <div key={k.id} className="fxb" style={{ padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{k.name || 'API Key'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text4)', fontFamily: 'var(--ffm)' }}>{k.prefix}</div>
                    {k.last_used_at && <div style={{ fontSize: 11, color: 'var(--text4)' }}>Last used: {new Date(k.last_used_at).toLocaleDateString()}</div>}
                  </div>
                  <button className="btn bdn bsm" onClick={() => revokeKey(k.id)}>Revoke</button>
                </div>
              ))}
            </div>
          )}
          <button className="btn bp" onClick={generateKey}><I n="plus" s={13} c="white" /> Generate New Key</button>
        </div>
      </div>
    </>
  );
}