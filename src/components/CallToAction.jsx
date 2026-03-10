import React from 'react';

export default function CallToAction({ data }) {
  const watchPoints = data?.watchPoints || [];

  return (
    <section id="action" className="report-section">
      <h2>Call to Action</h2>
      <p className="section-subtitle">Investor Summary &amp; Tactical Guidance</p>

      <h3>Recommendation</h3>
      <div className="recommendation-card">
        {data?.recommendation ?? 'No recommendation available.'}
      </div>

      {data?.stopLoss && (
        <div className="guidance-card guidance-card--green">
          <strong>Stop-Loss:</strong> {data.stopLoss}
        </div>
      )}

      {data?.currentHolderGuidance && (
        <div className="guidance-card">
          <strong>For Current Holders:</strong> {data.currentHolderGuidance}
        </div>
      )}

      {watchPoints.length > 0 && (
        <>
          <h3>Key Watch Points</h3>
          <ul className="watch-points">
            {watchPoints.map((wp, i) => (
              <li key={i}>
                <span className="watch-point-icon" aria-hidden="true">&#9888;</span>{' '}
                {wp}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
