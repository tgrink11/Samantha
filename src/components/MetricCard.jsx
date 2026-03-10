import React from 'react';

export default function MetricCard({ label, value, detail, variant = 'default' }) {
  return (
    <div className={`metric-card metric-card--${variant}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value ?? '—'}</span>
      {detail && <span className="metric-detail">{detail}</span>}
    </div>
  );
}
