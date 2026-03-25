"use client";

import React, { useState } from 'react';
import { I } from '@/components/Icons';
import { useToast } from '@/components/ui/Toast';
import { Footer } from '@/components/layout/Footer';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const toast = useToast();

  return (
    <div className="ai">
      <div style={{ maxWidth: 760, margin: '80px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: 'var(--bg2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <I n="mail" s={22} c="var(--text2)" />
          </div>
          <h1 style={{ fontSize: 32, fontFamily: 'var(--ffd)', fontWeight: 800, marginBottom: 8 }}>Talk to the Apexverse team</h1>
          <p style={{ fontSize: 15, color: 'var(--text3)', maxWidth: 560, margin: '0 auto', lineHeight: 1.75 }}>
            Tell us about the sites you need to ingest, the AI workflow you are building, and any delivery or deployment requirements. Public JSON testing is lightweight; production access is handled through onboarding.
          </p>
        </div>
        {sent ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: 48, height: 48, background: 'var(--green-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <I n="check" s={24} c="var(--green)" />
            </div>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Request received</h2>
            <p style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.7 }}>Thanks for the context. The team can now review your use case, connector needs, and deployment expectations.</p>
          </div>
        ) : (
          <form className="card fg" style={{ gap: 16 }} onSubmit={e => { e.preventDefault(); setSent(true); toast('Request submitted successfully.'); }}>
            <div className="g2">
              <div className="fg"><label className="fl">First Name</label><input required className="fi" /></div>
              <div className="fg"><label className="fl">Last Name</label><input required className="fi" /></div>
            </div>
            <div className="g2">
              <div className="fg"><label className="fl">Work Email</label><input required type="email" className="fi" /></div>
              <div className="fg"><label className="fl">Company</label><input required className="fi" /></div>
            </div>
            <div className="g2">
              <div className="fg"><label className="fl">Primary Use Case</label><select className="fse"><option>RAG / chatbot</option><option>Enterprise search</option><option>Knowledge sync</option><option>Other AI workflow</option></select></div>
              <div className="fg"><label className="fl">Estimated Website Scope</label><select className="fse"><option>Single docs site</option><option>Multiple sections</option><option>Several domains</option><option>Need help scoping</option></select></div>
            </div>
            <div className="fg"><label className="fl">Delivery Requirement</label><select className="fse"><option>JSON / export only</option><option>Chunked outputs</option><option>Vector database delivery</option><option>Need architecture guidance</option></select></div>
            <div className="fg"><label className="fl">How can we help?</label><textarea required className="fta" placeholder="Describe the sites, content type, downstream systems, and any security or deployment requirements." /></div>
            <button className="btn bp bfw blg mt2">Send request</button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
