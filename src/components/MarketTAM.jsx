import React from 'react';

export default function MarketTAM({ data }) {
  const segments = data?.segments || [];

  return (
    <section id="market" className="report-section">
      <h2>Market Opportunity &amp; TAM</h2>
      <p className="section-subtitle">{data?.title || 'Total Addressable Market Analysis'}</p>

      <h3 className="tam-total">{data?.totalTAM || '—'} TAM</h3>

      <div className="tam-segments">
        {segments.map((s, i) => (
          <div className="tam-segment" key={i}>
            <span className="segment-name">{s.name}:</span>
            <span className="segment-size">{s.size}</span>
            <span className="segment-desc">{s.description}</span>
          </div>
        ))}
      </div>

      {data?.commentary && (
        <div className="section-commentary">
          <strong>Market Position:</strong>{' '}
          {data.commentary.replace(/^Market Position:\s*/i, '')}
        </div>
      )}
    </section>
  );
}
