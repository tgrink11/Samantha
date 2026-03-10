import React from 'react';
import RiskBadge from './RiskBadge';

export default function RiskDashboard({ data }) {
  const riskFactors = data?.riskFactors || [];
  const tech = data?.technical || {};

  const technicalRows = [
    { label: 'Current Price',  value: tech.currentPrice },
    { label: '50-Day MA',      value: tech.sma50,       note: tech.sma50Note },
    { label: '200-Day MA',     value: tech.sma200,      note: tech.sma200Note },
    { label: '52-Week High',   value: tech.week52High,  note: tech.week52HighNote },
    { label: '52-Week Low',    value: tech.week52Low,   note: tech.week52LowNote },
    { label: 'Avg Volume (3M)', value: tech.avgVolume },
    { label: 'Short Interest', value: tech.shortInterest },
  ];

  return (
    <section id="risk" className="report-section">
      <h2>Risk Dashboard</h2>
      <p className="section-subtitle">3-Year Investment Risk Summary</p>

      {/* Top metrics row */}
      <div className="risk-metrics-grid">
        <div className="risk-metric-card">
          <span className="risk-metric-label">12-Month Volatility</span>
          <span className="risk-metric-value">{data?.volatility12m ?? '—'}</span>
          <small className="risk-metric-tag">{data?.volatilityLabel ?? ''}</small>
          {data?.volatilityDetail && (
            <p className="risk-metric-detail">{data.volatilityDetail}</p>
          )}
        </div>

        <div className="risk-metric-card">
          <span className="risk-metric-label">Beta vs S&amp;P 500</span>
          <span className="risk-metric-value">{data?.beta ?? '—'}</span>
          {data?.betaDetail && (
            <p className="risk-metric-detail">{data.betaDetail}</p>
          )}
        </div>

        <div className="risk-metric-card">
          <span className="risk-metric-label">Max Drawdown (1Y)</span>
          <span className="risk-metric-value">{data?.maxDrawdown1y ?? '—'}</span>
          {data?.maxDrawdownDetail && (
            <p className="risk-metric-detail">{data.maxDrawdownDetail}</p>
          )}
        </div>
      </div>

      {/* Risk factors list */}
      <h3>Key Risk Factors</h3>
      <div className="risk-factors-list">
        {riskFactors.map((rf, i) => (
          <div className="risk-factor-row" key={i}>
            <span className="risk-factor-icon" aria-hidden="true">&#9888;</span>
            <span className="risk-factor-name">{rf.name}</span>
            <RiskBadge severity={rf.severity} />
            {rf.detail && <p className="risk-factor-detail">{rf.detail}</p>}
          </div>
        ))}
        {riskFactors.length === 0 && (
          <p className="empty-state">No risk factors available</p>
        )}
      </div>

      {/* Technical summary */}
      <h3>Technical Summary</h3>
      <div className="technical-grid">
        {technicalRows.map((row, i) => (
          <div className="technical-row" key={i}>
            <span className="technical-row-label">{row.label}</span>
            <span className="technical-row-value">
              {row.value ?? '—'}
              {row.note && <small className="technical-row-note"> ({row.note})</small>}
            </span>
          </div>
        ))}
      </div>

      {data?.technicalAssessment && (
        <div className="technical-assessment dark-card">
          <strong>Technical Assessment:</strong>{' '}
          {data.technicalAssessment.replace(/^Technical Assessment:\s*/i, '')}
        </div>
      )}
    </section>
  );
}
