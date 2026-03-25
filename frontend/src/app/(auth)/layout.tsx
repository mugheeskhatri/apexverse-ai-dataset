"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname.startsWith('/checkout');

  return (
    <div
      className="app"
      style={{
        background: 'var(--bg)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isCheckout ? '96px 24px 40px' : '48px 24px 32px',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <div style={{ width: '100%', maxWidth: isCheckout ? 760 : 460 }}>
        {children}
      </div>
    </div>
  );
}
