import React from 'react';
import MetricCard from './MetricCard';

const GRADE_LABELS = {
  profitability: 'Profitability',
  liquidity: 'Liquidity',
  solvency: 'Solvency',
  efficiency: 'Efficiency',
};

function gradeVariant(grade) {
  const g = (grade || '').toUpperCase();
  if (g === 'A' || g === 'A+' || g === 'A-') return 'positive';
  if (g === 'B' || g === 'B+' || g === 'B-') return 'positive';
  if (g === 'C' || g === 'C+' || g === 'C-') return 'neutral';
  return 'negative';
}

function parseShortPercent(val) {
  if (!val) return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

export default function Quantitative({ data }) {
  const quant = data?.quantitative || data || {};
  const grades = quant?.healthGrades || {};
  const ownership = quant?.ownership || {};
  const shortInterest = quant?.shortInterest || {};
  const balanceSheet = quant?.balanceSheet || {};
  const bsItems = balanceSheet?.items || [];

  const shortHighlight = parseShortPercent(shortInterest.shortPercentFloat) > 15;

  return (
    <section id="quantitative" className="report-section quantitative">
      <h2 className="section-title">Quantitative Analysis</h2>

      {/* Health Grades */}
      <div className="subsection">
        <h3 className="subsection-title">Financial Health Grades</h3>
        <div className="grades-grid">
          {Object.entries(GRADE_LABELS).map(([key, label]) => {
            const item = grades[key];
            if (!item) return null;
            return (
              <div key={key} className={`grade-card grade-card--${gradeVariant(item.grade)}`}>
                <span className="grade-letter">{item.grade || '—'}</span>
                <span className="grade-label">{label}</span>
                <p className="grade-detail">{item.detail || ''}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ownership */}
      <div className="subsection">
        <h3 className="subsection-title">Stock Ownership</h3>
        <div className="stat-boxes">
          <MetricCard label="Institutions" value={ownership.institutions || '—'} />
          <MetricCard label="Public / Retail" value={ownership.public || '—'} />
          <MetricCard label="Insiders" value={ownership.insiders || '—'} />
        </div>
        {ownership.commentary && (
          <p className="commentary">{ownership.commentary}</p>
        )}
      </div>

      {/* Short Interest */}
      <div className="subsection">
        <h3 className="subsection-title">Short Interest</h3>
        <div className="stat-boxes">
          <MetricCard label="Shares Short" value={shortInterest.sharesShort || '—'} />
          <MetricCard
            label="% of Float"
            value={shortInterest.shortPercentFloat || '—'}
            variant={shortHighlight ? 'negative' : 'default'}
          />
          <MetricCard label="Short Ratio" value={shortInterest.shortRatio || '—'} />
          <MetricCard label="Prior Month" value={shortInterest.priorMonth || '—'} />
        </div>
        {shortHighlight && (
          <p className="short-warning">
            Short interest exceeds 15% of float — elevated bearish sentiment.
          </p>
        )}
        {shortInterest.commentary && (
          <p className="commentary">{shortInterest.commentary}</p>
        )}
      </div>

      {/* Balance Sheet */}
      <div className="subsection">
        <h3 className="subsection-title">Balance Sheet Highlights</h3>
        {bsItems.length > 0 && (
          <ul className="balance-sheet-list">
            {bsItems.map((item, i) => (
              <li key={i} className="balance-sheet-item">
                <span className="bs-label">{item.label || ''}</span>
                <span className="bs-value">{item.value || '—'}</span>
                {item.detail && <span className="bs-detail">{item.detail}</span>}
              </li>
            ))}
          </ul>
        )}
        {balanceSheet.commentary && (
          <p className="commentary">{balanceSheet.commentary}</p>
        )}
      </div>
    </section>
  );
}
