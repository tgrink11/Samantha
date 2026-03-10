import React from 'react';

const SCENARIO_META = {
  conservative: { label: 'Conservative', className: 'forecast-card--conservative' },
  moderate:     { label: 'Moderate (Base)', className: 'forecast-card--moderate forecast-card--featured' },
  aggressive:   { label: 'Aggressive', className: 'forecast-card--aggressive' },
};

function ForecastCard({ scenario, label, className }) {
  if (!scenario) return null;

  const meetsGoal = scenario.meetsGoal;

  return (
    <div className={`forecast-card ${className}`}>
      <h4 className="forecast-card-title">{label}</h4>
      <p className="forecast-assumptions">{scenario.assumptions ?? '—'}</p>

      <div className="forecast-targets">
        <div className="forecast-target">
          <span className="forecast-target-label">Jan 2027</span>
          <span className="forecast-target-value">{scenario.jan2027 ?? '—'}</span>
        </div>
        <div className="forecast-target">
          <span className="forecast-target-label">Jan 2028</span>
          <span className="forecast-target-value">{scenario.jan2028 ?? '—'}</span>
        </div>
        <div className="forecast-target">
          <span className="forecast-target-label">Jan 2029</span>
          <span className="forecast-target-value">{scenario.jan2029 ?? '—'}</span>
        </div>
      </div>

      <div className="forecast-roi">
        <span className="forecast-roi-label">3-Year ROI</span>
        <span className="forecast-roi-value">{scenario.threeYearROI ?? '—'}</span>
      </div>

      <div className={`forecast-goal ${meetsGoal ? 'forecast-goal--met' : 'forecast-goal--unmet'}`}>
        <span className="forecast-goal-icon">{meetsGoal ? '\u2705' : '\u274C'}</span>
        <span className="forecast-goal-text">
          {meetsGoal ? 'Meets 100% ROI Goal' : 'Below 100% ROI Goal'}
        </span>
      </div>
    </div>
  );
}

export default function Forecasts({ data }) {
  return (
    <section id="forecasts" className="report-section">
      <h2>3-Year Price Forecasts</h2>
      <p className="section-subtitle">Conservative, Moderate &amp; Aggressive Scenarios</p>

      <div className="forecast-grid">
        {Object.entries(SCENARIO_META).map(([key, meta]) => (
          <ForecastCard
            key={key}
            scenario={data?.[key]}
            label={meta.label}
            className={meta.className}
          />
        ))}
      </div>

      {data?.commentary && (
        <div className="section-commentary">
          <strong>100% ROI Goal Check:</strong>{' '}
          {data.commentary.replace(/^100% ROI Goal Check:\s*/i, '')}
        </div>
      )}
    </section>
  );
}
