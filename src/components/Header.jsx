import React from 'react';

export default function Header({ date, userName }) {
  const displayDate = date || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="report-header">
      <a href="#/" className="back-link">
        &larr; Back to Stock Directory
      </a>

      <div className="brand-bar">
        <span className="brand-label">BEST OF US INVESTORS</span>
        <h1>Master Financial Health &amp; Stock Forecast Report</h1>
        <div className="analysis-meta">
          <span className="analysis-meta-label">Analysis Date</span>
          <span className="analysis-meta-value">{displayDate}</span>
          {userName && (
            <span className="analysis-meta-user">Prepared for {userName}</span>
          )}
        </div>
      </div>
    </header>
  );
}
