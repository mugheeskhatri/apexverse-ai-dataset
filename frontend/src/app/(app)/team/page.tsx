"use client";
import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { I } from '@/components/Icons';
import { useAuth } from '@/lib/auth';

export default function TeamPage() {
  const { token, user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/team', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [token]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true); setMsg('');
    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: 'member' }),
    });
    const data = await res.json();
    if (res.ok) { setMsg(`Invite sent to ${inviteEmail}`); setInviteEmail(''); setShowInvite(false); }
    else setMsg(data.detail || 'Failed to send invite');
    setInviting(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this member?')) return;
    await fetch(`/api/team/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <>
      <TopBar title="Team" sub="Manage workspace members" actions={
        <button className="btn bp" onClick={() => setShowInvite(!showInvite)}>
          <I n="user-plus" s={14} c="white" /> Invite Member
        </button>
      } />
      <div className="pc" style={{ maxWidth: 840, margin: '0 auto' }}>
        {msg && <div style={{ background: msg.includes('sent') ? 'var(--green-bg)' : 'var(--red-bg)', border: `1px solid ${msg.includes('sent') ? 'rgba(26,122,79,.2)' : 'rgba(192,57,43,.2)'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: msg.includes('sent') ? 'var(--green)' : 'var(--red)' }}>{msg}</div>}
        {showInvite && (
          <div className="card mb6">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Invite a team member</h3>
            <form className="fxc" style={{ gap: 10 }} onSubmit={handleInvite}>
              <input required type="email" className="fi" placeholder="name@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={{ flex: 1 }} />
              <button className="btn bp" disabled={inviting}>{inviting ? 'Sending...' : 'Send Invite'}</button>
              <button type="button" className="btn bs" onClick={() => setShowInvite(false)}>Cancel</button>
            </form>
          </div>
        )}
        <div className="card">
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Members ({members.length + 1})</h3>
          </div>
          <table className="dt">
            <thead><tr><th>Member</th><th>Role</th><th>Status</th><th /></tr></thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ fontWeight: 600 }}>{user?.name || 'You'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{user?.email}</div>
                </td>
                <td>Owner</td>
                <td><span className="badge bgg">Active</span></td>
                <td></td>
              </tr>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--text3)' }}>Loading...</td></tr>
              ) : members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{m.email}</div>
                    {m.accepted_at && <div style={{ fontSize: 12, color: 'var(--text3)' }}>Joined {new Date(m.accepted_at).toLocaleDateString()}</div>}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{m.role}</td>
                  <td><span className={`badge ${m.status === 'active' ? 'bgg' : 'bgy'}`} style={{ textTransform: 'capitalize' }}>{m.status}</span></td>
                  <td>
                    <button className="btn bg2btn bsm" onClick={() => handleRemove(m.id)}>
                      <I n="trash" s={13} c="var(--red)" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}