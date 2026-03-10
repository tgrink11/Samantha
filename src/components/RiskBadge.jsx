import React from 'react';

const SEVERITY_MAP = {
  high: 'high',
  medium: 'medium',
  low: 'low',
};

export default function RiskBadge({ severity }) {
  const key = (severity || 'medium').toLowerCase();
  const cls = SEVERITY_MAP[key] || 'medium';

  return (
    <span className={`risk-badge risk-badge--${cls}`}>
      {severity || 'Medium'}
    </span>
  );
}
