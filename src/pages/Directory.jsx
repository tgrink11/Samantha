import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/directory.css';

export default function Directory() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/reports');
        if (!res.ok) throw new Error('Failed to load reports');
        const data = await res.json();
        setReports(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  return (
    <div className="directory-page">
      <div className="directory-hero">
        <h1>Samantha &mdash; Stock Analyst</h1>
        <p>Best of Us Investors</p>
      </div>

      <div className="directory-content">
        {loading && (
          <div className="spinner" aria-label="Loading reports" />
        )}

        {error && (
          <div className="form-error">{error}</div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="empty-state">
            <h3>No reports yet</h3>
            <p>Analyze your first stock to get started!</p>
            <Link to="/analyze">Analyze a Stock</Link>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="directory-grid">
            {reports.map((report) => (
              <Link
                key={report.ticker}
                to={`/report/${report.ticker}`}
                className="report-card"
              >
                <span className="report-card-ticker">{report.ticker}</span>
                <p className="report-card-company">
                  {report.company_name || report.ticker}
                </p>
                <div className="report-card-meta">
                  <span>{report.analysis_date || 'N/A'}</span>
                  <span>
                    {report.input_price
                      ? `$${Number(report.input_price).toFixed(2)}`
                      : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link to="/analyze" className="analyze-fab no-print">
        + Analyze New Stock
      </Link>
    </div>
  );
}
