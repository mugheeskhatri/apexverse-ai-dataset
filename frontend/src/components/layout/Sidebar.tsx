"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { I } from '../Icons';
import { Logo } from '../ui/Shared';
import { useAuth } from '@/lib/auth';

export const Sidebar = () => {
  const [umOpen, setUmOpen] = useState(false);
  const pathname = usePathname() || '';
  const page     = pathname.split('/')[1] || 'dashboard';
  const { user, logout } = useAuth();
  const router   = useRouter();

  const nav = [
    { p: 'dashboard',      l: 'Dashboard', ico: 'home'        },
    { p: 'projects',       l: 'Projects',  ico: 'folder'      },
    { p: 'analytics',      l: 'Analytics', ico: 'bar-chart'   },
    { p: 'billing',        l: 'Billing',   ico: 'credit-card' },
    { p: 'team',           l: 'Team',      ico: 'users'       },
    { p: 'docs',           l: 'Docs',      ico: 'book'        },
    { p: 'support',        l: 'Support',   ico: 'life-buoy'   },
  ];

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'AP';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="sidebar">
      <div className="sbh">
        <Link href="/" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'none' }}>
          <Logo />
        </Link>
      </div>

      <div className="sbn">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text4)', padding: '6px 9px 4px', marginTop: 4 }}>Main</div>
        {nav.slice(0, 5).map(item => (
          <Link key={item.p} href={`/${item.p}`} className={`ntab${page === item.p ? ' act' : ''}`} style={{ textDecoration: 'none' }}>
            <I n={item.ico} s={14} c={page === item.p ? 'var(--text)' : 'var(--text3)'} />{item.l}
          </Link>
        ))}
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text4)', padding: '12px 9px 4px' }}>Help</div>
        {nav.slice(5).map(item => (
          <Link key={item.p} href={`/${item.p}`} className={`ntab${page === item.p ? ' act' : ''}`} style={{ textDecoration: 'none' }}>
            <I n={item.ico} s={14} c={page === item.p ? 'var(--text)' : 'var(--text3)'} />{item.l}
          </Link>
        ))}
      </div>

      <div className="sbf">
        <Link href="/settings" className={`ntab${page === 'settings' ? ' act' : ''}`} style={{ textDecoration: 'none' }}>
          <I n="settings" s={14} c="var(--text3)" />Settings
        </Link>
        <div className="rel" style={{ marginTop: 5 }}>
          <button onClick={() => setUmOpen(!umOpen)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 'var(--r)', background: umOpen ? 'var(--bg2)' : 'transparent', border: 'none', cursor: 'pointer' }}>
            <div className="av" style={{ cursor: 'default' }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || user?.email || 'Account'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text4)', textTransform: 'capitalize' }}>
                {user?.plan || 'Free'} Plan
              </div>
            </div>
            <I n="more-horizontal" s={12} c="var(--text3)" />
          </button>

          {umOpen && (
            <div className="dd" style={{ bottom: 'calc(100% + 4px)', top: 'auto', left: 0, right: 0 }}>
              <div style={{ padding: '10px 13px 6px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || 'Account'}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{user?.email}</div>
              </div>
              <Link href="/settings" className="ddi" onClick={() => setUmOpen(false)} style={{ textDecoration: 'none' }}>
                <I n="user" s={13} />Account settings
              </Link>
              <Link href="/billing" className="ddi" onClick={() => setUmOpen(false)} style={{ textDecoration: 'none' }}>
                <I n="credit-card" s={13} />Billing
              </Link>
              <div className="ddsep" />
              <button className="ddi ddng" onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <I n="log-out" s={13} c="var(--red)" />Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
