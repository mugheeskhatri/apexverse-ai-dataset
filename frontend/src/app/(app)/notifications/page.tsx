"use client";
import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { I } from '@/components/Icons';
import { useAuth } from '@/lib/auth';

const TYPE_ICON: Record<string, { ico: string; c: string }> = {
  run_complete:  { ico: 'check-circle',    c: 'var(--green)'  },
  run_failed:    { ico: 'alert-circle',    c: 'var(--red)'    },
  quota_warning: { ico: 'alert-triangle',  c: 'var(--yellow)' },
  billing:       { ico: 'credit-card',     c: 'var(--blue)'   },
  team_invite:   { ico: 'users',           c: 'var(--brand)'  },
  system:        { ico: 'info',            c: 'var(--text3)'  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setNotifs(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [token]);

  const markAllRead = async () => {
    await fetch('/api/notifications/mark-all-read', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <>
      <TopBar title="Notifications" sub={unread > 0 ? `${unread} unread` : 'All caught up'} actions={
        unread > 0 ? <button className="btn bs bsm" onClick={markAllRead}>Mark all read</button> : undefined
      } />
      <div className="pc" style={{ maxWidth: 680, margin: '0 auto' }}>
        {loading ? (
          <div className="card sk" style={{ height: 200 }} />
        ) : notifs.length === 0 ? (
          <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
            <I n="bell" s={32} c="var(--border)" />
            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>No notifications</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>You are all caught up</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {notifs.map(n => {
              const { ico, c } = TYPE_ICON[n.type] || TYPE_ICON.system;
              return (
                <div key={n.id} style={{ background: n.read ? 'var(--surface)' : 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', opacity: n.read ? 0.75 : 1 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <I n={ico} s={15} c={c} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>{n.body}</div>
                    <div style={{ fontSize: 12, color: 'var(--text4)', marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0, marginTop: 8 }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}