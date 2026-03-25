import React from 'react';
import { Footer } from '../layout/Footer';

const content = {
  'Privacy Policy': {
    intro: 'This policy explains how Apexverse handles account information, customer configuration data, and content processed through the platform.',
    sections: [
      {
        heading: 'Information We Collect',
        body: 'We collect account details, workspace configuration, billing contacts, and operational telemetry needed to run and secure the service. Customer content submitted for crawling, extraction, or delivery is processed according to workspace settings and support arrangements.',
      },
      {
        heading: 'How We Use Information',
        body: 'We use information to provision workspaces, run extraction jobs, support integrations, monitor platform health, prevent abuse, and respond to support or security requests. We do not position public marketing tests as production data pipelines.',
      },
      {
        heading: 'Security and Retention',
        body: 'Access to customer environments is restricted to authorized personnel with a business need. Retention and deletion practices depend on the service configuration, deployment model, and contractual terms established during onboarding.',
      },
      {
        heading: 'Questions',
        body: 'For privacy questions, data handling requests, or customer-specific requirements, contact the Apexverse team through the sales or support channels listed on this site.',
      },
    ],
  },
  'Terms of Service': {
    intro: 'These terms govern use of Apexverse software, public test flows, and customer workspaces provisioned for website ingestion and AI delivery workflows.',
    sections: [
      {
        heading: 'Use of the Service',
        body: 'Customers are responsible for ensuring they have the right to crawl, extract, store, and sync the content they submit to Apexverse. Public test capabilities are for limited evaluation only and may be rate limited, restricted, or disabled at any time.',
      },
      {
        heading: 'Customer Responsibilities',
        body: 'Customers are responsible for the sites, credentials, API keys, vector databases, and embedding providers they connect. Customers must not use the service for unlawful access, abusive crawling, or violation of third-party terms.',
      },
      {
        heading: 'Commercial Terms',
        body: 'Self-serve plans may be purchased through the website using the available billing flow, while enterprise deployments, custom scope, and expanded support may be governed by an order form or other written agreement with Apexverse.',
      },
      {
        heading: 'Availability and Changes',
        body: 'We may update, improve, or deprecate platform capabilities over time. Where applicable, material commercial or contractual changes are handled through the customer agreement in force.',
      },
    ],
  },
  'Cookie Policy': {
    intro: 'Apexverse uses cookies and similar technologies to operate the website, remember user preferences, and understand site performance.',
    sections: [
      {
        heading: 'Essential Cookies',
        body: 'These cookies support core website functionality such as authentication, security controls, and session continuity.',
      },
      {
        heading: 'Analytics Cookies',
        body: 'Analytics technologies may be used to understand how visitors navigate the site, which pages are most useful, and where content should be improved.',
      },
      {
        heading: 'Managing Cookies',
        body: 'Most browsers allow you to review, restrict, or clear cookies. Disabling certain cookies may affect how authentication and site functionality behave.',
      },
      {
        heading: 'Updates',
        body: 'We may revise this policy as the site, analytics tooling, or regulatory requirements change. Updated versions will be posted on this page.',
      },
    ],
  },
} as const;

export const SimplePage = ({ title }: { title: string }) => {
  const page = content[title as keyof typeof content];

  return (
    <div className="ai">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '72px 24px 80px' }}>
        <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', fontFamily: 'var(--ffd)', fontWeight: 800, marginBottom: 14 }}>{title}</h1>
        <p style={{ fontSize: 15, color: 'var(--text3)', lineHeight: 1.8, marginBottom: 32 }}>{page.intro}</p>
        {page.sections.map(section => (
          <section key={section.heading} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontFamily: 'var(--ffd)', marginBottom: 10 }}>{section.heading}</h2>
            <p style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.8 }}>{section.body}</p>
          </section>
        ))}
      </div>
      <Footer />
    </div>
  );
};
