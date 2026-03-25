"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/lib/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) router.replace('/login');
  }, [token, loading, router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontSize: 14, color: 'var(--text3)' }}>Loading...</div>
    </div>
  );

  if (!token) return null;

  return (
    <div className="app">
      <Sidebar />
      <div className="mc2">{children}</div>
    </div>
  );
}
