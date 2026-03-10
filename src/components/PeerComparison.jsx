import React from 'react';

export default function PeerComparison({ data }) {
  const rows = data?.rows || [];

  return (
    <section id="peers" className="report-section">
      <h2>Peer Comparison</h2>
      <p className="section-subtitle">Competitive Landscape</p>

      <div className="table-wrap">
        <table className="data-table peer-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Mkt Cap</th>
              <th>Rev Growth</th>
              <th>Gross Margin</th>
              <th>P/S</th>
              <th>Scale</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i === 0 ? 'peer-row--highlight' : ''}>
                <td className="peer-company">{row.company ?? '—'}</td>
                <td>{row.marketCap ?? '—'}</td>
                <td>{row.revenueGrowth ?? '—'}</td>
                <td>{row.grossMargin ?? '—'}</td>
                <td>{row.priceSales ?? '—'}</td>
                <td>{row.scale ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">No peer data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data?.commentary && (
        <div className="section-commentary">
          <strong>Competitive Edge:</strong>{' '}
          {data.commentary.replace(/^Competitive Edge:\s*/i, '')}
        </div>
      )}
    </section>
  );
}
