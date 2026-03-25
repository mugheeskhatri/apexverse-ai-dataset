"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { I } from '../Icons';
import { useAuth } from '@/lib/auth';

const TYPE_ICON: Record<string, { ico: string; c: string }> = {
  run_complete:  { ico: 'check-circle',   c: 'var(--green)'  },
  run_failed:    { ico: 'alert-circle',   c: 'var(--red)'    },
  quota_warning: { ico: 'alert-triangle', c: 'var(--yellow)' },
  billing:       { ico: 'credit-card',    c: 'var(--blue)'   },
  team_invite:   { ico: 'users',          c: 'var(--brand)'  },
  system:        { ico: 'info',           c: 'var(--text3)'  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const TopBar = ({
  title, sub, actions, back,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  back?: string;
}) => {
  const { token } = useAuth();
  const router = useRouter();
  const [nOpen,    setNOpen]    = useState(false);
  const [notifs,   setNotifs]   = useState<any[]>([]);
  const [unread,   setUnread]   = useState(0);
  const [loading,  setLoading]  = useState(false);

  // Fetch unread count on mount (lightweight)
  useEffect(() => {
    if (!token) return;
    fetch('/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setUnread(d.count || 0))
      .catch(() => {});
  }, [token]);

  // Fetch notifications when dropdown opens
  const fetchNotifs = useCallback(async () => {
    if (!token || notifs.length > 0) return;
    setLoading(true);
    try {
      const res  = await fetch('/api/notifications?size=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifs(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false); }
  }, [token, notifs.length]);

  const handleOpen = () => {
    const next = !nOpen;
    setNOpen(next);
    if (next) fetchNotifs();
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <div className="topbar">
      {/* Left — title + back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {back && (
          <Link
            href={`/${back}`}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text3)', fontSize: 13, fontWeight: 500, flexShrink: 0, textDecoration: 'none' }}
          >
            <I n="arrow-left" s={12} c="var(--text3)" /> Back
          </Link>
        )}
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--ffd)', lineHeight: 1.2 }}>{title}</div>
          {sub && <div style={{ fontSize: 13, color: 'var(--text3)' }}>{sub}</div>}
        </div>
      </div>

      {/* Right — actions + bell */}
      <div className="fxc" style={{ gap: 8 }}>
        {actions}
        <div className="rel">
          <button
            onClick={handleOpen}
            style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: nOpen ? 'var(--bg2)' : 'transparent', border: '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'all .14s' }}
          >
            <I n="bell" s={15} c="var(--text2)" />
            {unread > 0 && (
              <span style={{ position: 'absolute', top: 5, right: 5, minWidth: 14, height: 14, background: 'var(--red)', borderRadius: 999, border: '1.5px solid var(--surface)', fontSize: 9, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {nOpen && (
            <div className="dd" style={{ width: 340, right: 0, top: 'calc(100% + 7px)' }}>
              {/* Header */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  Notifications {unread > 0 && <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>({unread} new)</span>}
                </span>
                <div className="fxc" style={{ gap: 10 }}>
                  {unread > 0 && (
                    <button onClick={markAllRead} style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Mark all read
                    </button>
                  )}
                  <Link href="/notifications" onClick={() => setNOpen(false)} style={{ fontSize: 13, color: 'var(--brand)', textDecoration: 'none' }}>
                    View all
                  </Link>
                </div>
              </div>

              {/* Body */}
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading...</div>
              ) : notifs.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                  <I n="bell" s={24} c="var(--border)" />
                  <div style={{ marginTop: 8 }}>No notifications yet</div>
                </div>
              ) : (
                notifs.slice(0, 5).map(n => {
                  const { ico, c } = TYPE_ICON[n.type] || TYPE_ICON.system;
                  return (
                    <div
                      key={n.id}
                      className="ddi"
                      style={{ alignItems: 'flex-start', gap: 10, background: n.read ? 'transparent' : 'var(--bg2)', cursor: n.link ? 'pointer' : 'default' }}
                      onClick={() => { if (n.link) { router.push(n.link); setNOpen(false); } }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <I n={ico} s={13} c={c} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 1 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{n.body}</div>
                        <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 3 }}>{timeAgo(n.created_at)}</div>
                      </div>
                      {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0, marginTop: 8 }} />}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
