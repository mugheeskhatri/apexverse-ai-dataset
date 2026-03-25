"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '../ui/Shared';
import { useAuth } from '@/lib/auth';

export const PubNav = () => {
  const pathname  = usePathname();
  const { user, token, logout } = useAuth();
  const router    = useRouter();

  // Hide entirely on all app/dashboard pages
  const appPaths = ['/dashboard','/projects','/analytics','/billing','/team','/settings','/support','/notifications','/create-project'];
  if (appPaths.some(p => pathname.startsWith(p))) return null;

  const links = [
    { href: '/features',     label: 'Platform'     },
    { href: '/integrations', label: 'Integrations' },
    { href: '/pricing',      label: 'Pricing'      },
    { href: '/enterprise',   label: 'Enterprise'   },
    { href: '/docs',         label: 'Docs'         },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="pnav">
      <div className="pni">
        <div className="fxc" style={{ gap: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>
          <div className="fxc" style={{ gap: 1 }}>
            {links.map(link => (
              <Link key={link.href} href={link.href} className={`nlink${isActive(link.href) ? ' nact' : ''}`} style={{ textDecoration: 'none' }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="fxc" style={{ gap: 8 }}>
          {token && user ? (
            <>
              <Link href="/dashboard" className="btn bs bsm" style={{ textDecoration: 'none' }}>
                Dashboard
              </Link>
              <button className="btn bp bsm" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login"  className="btn bg2btn bsm" style={{ textDecoration: 'none' }}>Log in</Link>
              <Link href="/signup" className="btn bp bsm"     style={{ textDecoration: 'none' }}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
