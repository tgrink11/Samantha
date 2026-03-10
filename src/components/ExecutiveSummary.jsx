import React from 'react';

export default function ExecutiveSummary({ data }) {
  const summary = data?.executiveSummary || data || {};
  const takeaways = summary?.takeaways || [];

  if (takeaways.length === 0) {
    return null;
  }

  return (
    <section id="executive" className="report-section executive-summary">
      <h2 className="section-title">Executive Summary</h2>
      <p className="section-subtitle">Three Key Investor Takeaways</p>

      <div className="takeaways-grid">
        {takeaways.map((t, i) => (
          <div key={t.number ?? i} className="takeaway-card">
            <span className="takeaway-num">
              {String(t.number ?? i + 1).padStart(2, '0')}
            </span>
            <h3 className="takeaway-title">{t.title || 'Takeaway'}</h3>
            <p className="takeaway-body">{t.body || ''}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
