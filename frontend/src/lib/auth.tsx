"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://72.61.7.93:8000'
// All calls go to /api/... (Next.js proxy) — never directly to port 8050
// This avoids CORS completely — same origin requests don't need CORS headers
const API = API_URL + '/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  plan: string | null;
  subscription_status: string | null;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setTokenFromCheckout: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('apx_token');
    const savedUser  = sessionStorage.getItem('apx_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const _save = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    sessionStorage.setItem('apx_token', t);
    sessionStorage.setItem('apx_user', JSON.stringify(u));
  };

  const _clear = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('apx_token');
    sessionStorage.removeItem('apx_user');
    sessionStorage.removeItem('apx_pending_token');
    sessionStorage.removeItem('apx_pending_user');
  };

  const signup = async (name: string, email: string, password: string) => {
    const res  = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Signup failed');
    sessionStorage.setItem('apx_pending_token', data.access_token);
    sessionStorage.setItem('apx_pending_user',  JSON.stringify(data.user));
  };

  const login = async (email: string, password: string) => {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 402) {
        throw Object.assign(new Error(data.detail?.message || 'Subscription required'), { code: data.detail?.code });
      }
      throw new Error(data.detail || 'Invalid email or password');
    }
    _save(data.access_token, data.user);
  };

  const logout = useCallback(() => {
    fetch(`${API}/auth/logout`, { method: 'POST' }).catch(() => {});
    _clear();
  }, []);

  const setTokenFromCheckout = (t: string, u: User) => _save(t, u);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, setTokenFromCheckout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export async function apiFetch(path: string, token: string | null, options: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw Object.assign(new Error(err.detail || 'Request failed'), { status: res.status, data: err });
  }
  return res.json();
}
