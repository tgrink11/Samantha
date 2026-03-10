import React from 'react';
import MetricCard from './MetricCard';

function scoreVariant(score) {
  const n = parseFloat(score);
  if (isNaN(n)) return 'neutral';
  if (n >= 40) return 'positive';
  if (n >= 20) return 'neutral';
  return 'negative';
}

export default function GrowthRule40({ data }) {
  const growth = data?.growth || data || {};
  const score = growth?.ruleOf40Score ?? '—';
  const max = growth?.ruleOf40Max ?? '40';
  const scoreCommentary = growth?.ruleOf40Commentary || '';
  const metrics = growth?.metrics || [];
  const commentary = growth?.commentary || '';

  return (
    <section id="growth" className="report-section growth-rule40">
      <h2 className="section-title">Growth &amp; Rule of 40</h2>

      {/* Rule of 40 Score Badge */}
      <div className="rule40-hero">
        <div className={`rule40-badge rule40-badge--${scoreVariant(score)}`}>
          <span className="rule40-score">{score}</span>
          <span className="rule40-separator">/</span>
          <span className="rule40-max">{max}</span>
        </div>
        <div className="rule40-label">
          <span className="rule40-title">Kerry&rsquo;s Rule of 40</span>
          {scoreCommentary && (
            <p className="rule40-commentary">{scoreCommentary}</p>
          )}
        </div>
      </div>

      {/* Growth Metrics Grid */}
      {metrics.length > 0 && (
        <div className="growth-metrics-grid">
          {metrics.map((m, i) => (
            <MetricCard
              key={i}
              label={m.label || `Metric ${i + 1}`}
              value={m.value || '—'}
            />
          ))}
        </div>
      )}

      {/* Commentary */}
      {commentary && (
        <p className="commentary">{commentary}</p>
      )}
    </section>
  );
}
