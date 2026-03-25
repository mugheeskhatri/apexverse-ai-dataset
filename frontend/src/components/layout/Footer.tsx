import React from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Shared';

export const Footer = () => (
  <footer className="footer">
    <div className="fg2">
      <div className="fc">
        <Logo dark />
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.32)', marginTop: 13, lineHeight: 1.75, maxWidth: 240 }}>
          Web data ingestion for enterprise AI teams. Crawl sites, extract structured content, and deliver clean knowledge into retrieval and search systems.
        </p>
      </div>
      {[
        { h: 'Product', links: [['Platform', 'features'], ['Integrations', 'integrations'], ['Pricing', 'pricing'], ['Enterprise', 'enterprise']] },
        { h: 'Resources', links: [['Docs', 'docs'], ['Contact', 'contact'], ['About', 'about']] },
        { h: 'Legal', links: [['Privacy', 'privacy'], ['Terms', 'terms'], ['Cookies', 'cookies']] },
      ].map(col => (
        <div key={col.h} className="fc">
          <h4>{col.h}</h4>
          {col.links.map(([l, p]) => (
            <Link key={l} href={`/${p}`} className="fl2" style={{ textDecoration: 'none' }}>
              {l}
            </Link>
          ))}
        </div>
      ))}
    </div>
    <div className="fb">
      <span>© 2026 Apexverse, Inc. All rights reserved.</span>
    </div>
  </footer>
);
