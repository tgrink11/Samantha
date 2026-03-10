import React from 'react';

export default function KeyRatios({ data }) {
  const ratios = data?.keyRatios || data || {};
  const rows = ratios?.rows || [];
  const commentary = ratios?.commentary || '';

  if (rows.length === 0 && !commentary) {
    return null;
  }

  return (
    <section id="key-ratios" className="report-section key-ratios">
      <h2 className="section-title">Key Ratios</h2>

      {rows.length > 0 && (
        <div className="table-wrapper">
          <table className="ratios-table">
            <thead>
              <tr>
                <th className="ratios-th">Metric</th>
                <th className="ratios-th">Current</th>
                <th className="ratios-th">Prior Period 1</th>
                <th className="ratios-th">Prior Period 2</th>
                <th className="ratios-th">Industry Avg</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'ratios-row--even' : 'ratios-row--odd'}>
                  <td className="ratios-td ratios-metric">{row.metric || '—'}</td>
                  <td className="ratios-td">{row.current || '—'}</td>
                  <td className="ratios-td">{row.prior1 || '—'}</td>
                  <td className="ratios-td">{row.prior2 || '—'}</td>
                  <td className="ratios-td">{row.industryAvg || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {commentary && (
        <p className="commentary">{commentary}</p>
      )}
    </section>
  );
}
