import React from 'react';

function truncate(str, max = 150) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max).trimEnd() + '...' : str;
}

function recClass(rec) {
  const r = (rec || '').toUpperCase();
  if (r.includes('BUY')) return 'recommendation-badge--buy';
  if (r.includes('SELL')) return 'recommendation-badge--sell';
  return 'recommendation-badge--hold';
}

function parsePrice(val) {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? null : n;
}

function formatPrice(val) {
  if (val == null) return '—';
  if (typeof val === 'string' && val.includes('$')) return val;
  const n = parsePrice(val);
  return n != null ? `$${n.toFixed(2)}` : '—';
}

export default function HeroSection({ data, sharesHeld, portfolioWeight }) {
  const company = data?.company || {};
  const hero = data?.hero || {};

  const numPrice = parsePrice(hero.price);
  const numShares = typeof sharesHeld === 'number' ? sharesHeld : parseInt(sharesHeld) || null;
  const positionValue =
    numPrice != null && numShares != null
      ? (numPrice * numShares).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      : null;

  return (
    <section className="hero-section">
      <div className="hero-banner">
        <div className="hero-exchange-badge">
          {company.exchange || 'NASDAQ'}: {company.ticker || '—'}
        </div>

        <h2 className="hero-company-name">{company.name || 'Company Name'}</h2>

        <p className="hero-description">{truncate(company.description)}</p>

        <div className="hero-stats-grid">
          <div className="hero-stat hero-stat--price">
            <span className="hero-stat-label">Price</span>
            <span className="hero-stat-value">{formatPrice(hero.price)}</span>
            {hero.priceChangeToday && (
              <span className="hero-stat-change">{hero.priceChangeToday}</span>
            )}
          </div>

          <div className="hero-stat">
            <span className="hero-stat-label">Market Cap</span>
            <span className="hero-stat-value">{hero.marketCapLabel || hero.marketCap || '—'}</span>

          </div>

          <div className="hero-stat">
            <span className="hero-stat-label">52-Week Range</span>
            <span className="hero-stat-value">{hero.week52Range || '—'}</span>
            {hero.week52RangeNote && (
              <span className="hero-stat-detail">{hero.week52RangeNote}</span>
            )}
          </div>
        </div>

        {hero.recommendation && (
          <div className="hero-recommendation">
            <span className={`recommendation-badge ${recClass(hero.recommendation)}`}>
              {hero.recommendation}
            </span>
            {hero.recommendationDetail && (
              <p className="recommendation-detail">{hero.recommendationDetail}</p>
            )}
          </div>
        )}
      </div>

      {(numShares != null || portfolioWeight != null) && (
        <div className="hero-portfolio-bar">
          {numShares != null && (
            <div className="hero-portfolio-stat">
              <span className="hero-portfolio-label">Shares Held</span>
              <span className="hero-portfolio-value">{numShares.toLocaleString()}</span>
            </div>
          )}
          {portfolioWeight != null && (
            <div className="hero-portfolio-stat">
              <span className="hero-portfolio-label">Portfolio Weight</span>
              <span className="hero-portfolio-value">{portfolioWeight}</span>
            </div>
          )}
          {positionValue != null && (
            <div className="hero-portfolio-stat">
              <span className="hero-portfolio-label">Position Value</span>
              <span className="hero-portfolio-value">{positionValue}</span>
            </div>
          )}
          {hero.recommendation && (
            <div className="hero-portfolio-stat">
              <span className={`recommendation-badge recommendation-badge--sm ${recClass(hero.recommendation)}`}>
                {hero.recommendation}
              </span>
              {hero.recommendationDetail && (
                <span className="recommendation-detail-sm">{hero.recommendationDetail}</span>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
