import React from 'react';

export default function Qualitative({ data }) {
  const rubric = data?.rubricScore;

  return (
    <section id="qualitative" className="report-section">
      <h2>Qualitative Analysis</h2>
      <p className="section-subtitle">
        Business Model, Management, Competitive Moat &amp; Macro Factors
      </p>

      <h3>Business Model</h3>
      <p>{data?.businessModel ?? 'No business model analysis available.'}</p>

      <h3>Management Quality</h3>
      <p>{data?.managementQuality ?? 'No management quality assessment available.'}</p>

      <h3>Competitive Moat &amp; Innovation</h3>
      <p>{data?.competitiveMoat ?? 'No competitive moat analysis available.'}</p>

      <h3>Regulatory &amp; Geopolitical</h3>
      <p>{data?.regulatoryGeopolitical ?? 'No regulatory assessment available.'}</p>

      <h3>Rubric Confidence Score</h3>
      <div className="rubric-score">
        <span className="rubric-number">
          {rubric?.score ?? '—'} / {rubric?.max ?? 10}
        </span>
        {rubric?.commentary && <p>{rubric.commentary}</p>}
      </div>
    </section>
  );
}
