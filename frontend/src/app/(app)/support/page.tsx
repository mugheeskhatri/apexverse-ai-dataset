"use client";
import React, { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { I } from '@/components/Icons';
import { useAuth } from '@/lib/auth';

export default function SupportPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ subject: '', message: '', priority: 'normal' });
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In production this would call POST /support or send via email
    setSent(true);
  };

  return (
    <>
      <TopBar title="Support" sub="Get help from the Apexverse team" />
      <div className="pc" style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="g2 mb6">
          <a href="https://docs.apexverse.ai" target="_blank" rel="noreferrer" className="card ch ptr" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, background: 'var(--brand-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <I n="book" s={20} c="var(--brand)" />
            </div>
            <div><h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Documentation</h3><p style={{ fontSize: 13, color: 'var(--text3)' }}>Guides, API reference, and tutorials.</p></div>
          </a>
          <a href="mailto:support@apexverse.ai" className="card ch ptr" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, background: 'var(--blue-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <I n="mail" s={20} c="var(--blue)" />
            </div>
            <div><h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Email Support</h3><p style={{ fontSize: 13, color: 'var(--text3)' }}>support@apexverse.ai · We respond within 24h.</p></div>
          </a>
        </div>

        {sent ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <I n="check-circle" s={32} c="var(--green)" />
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 12 }}>Message sent!</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>We will get back to you within 24 hours.</div>
            <button className="btn bs" style={{ marginTop: 16 }} onClick={() => setSent(false)}>Send another</button>
          </div>
        ) : (
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Send a message</h3>
            <form className="fg" style={{ gap: 16 }} onSubmit={handleSubmit}>
              <div className="fg"><label className="fl">Subject</label><input required className="fi" placeholder="Brief description of your issue" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} /></div>
              <div className="fg">
                <label className="fl">Priority</label>
                <select className="fse" value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                  <option value="low">Low — General question</option>
                  <option value="normal">Normal — Something not working</option>
                  <option value="high">High — Blocking my work</option>
                  <option value="critical">Critical — Data loss / outage</option>
                </select>
              </div>
              <div className="fg"><label className="fl">Message</label><textarea required className="fi fta" rows={5} placeholder="Describe your issue in detail..." value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} /></div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Sending from: {user?.email}</div>
              <button type="submit" className="btn bp" style={{ alignSelf: 'flex-start' }}>Send Message</button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}