"use client";
import React, { useState, useCallback, createContext, useContext } from 'react';
import { I } from '../Icons';

const TC = createContext<((msg: string, type?: 'success'|'error'|'warning'|'info') => void) | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<{id: number, msg: string, t: string}[]>([]);
  const show = useCallback((msg: string, type?: string) => {
    const t = type || 'success';
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, t }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3200);
  }, []);
  
  const icons: Record<string, string> = { success: 'check-circle', error: 'alert-circle', warning: 'alert-triangle', info: 'info' };
  const colors: Record<string, string> = { success: 'var(--green)', error: 'var(--red)', warning: 'var(--yellow)', info: 'var(--blue)' };
  
  return (
    <TC.Provider value={show}>
      {children}
      <div className="tc">
        {toasts.map(t => (
          <div key={t.id} className={'toast tt' + t.t[0]}>
            <I n={icons[t.t]} s={16} c={colors[t.t]} />
            <span style={{ fontSize: 14, color: 'var(--text)', flex: 1 }}>{t.msg}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0 }}>
              <I n="x" s={13} />
            </button>
          </div>
        ))}
      </div>
    </TC.Provider>
  );
};

export const useToast = () => {
    const ctx = useContext(TC);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
};
