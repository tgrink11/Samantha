import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LoadingOverlay from '../components/LoadingOverlay';
import '../styles/analyze.css';

export default function Analyze() {
  const navigate = useNavigate();

  const [ticker, setTicker] = useState('');
  const [price, setPrice] = useState('');
  const [shares, setShares] = useState('0');
  const [portfolioPct, setPortfolioPct] = useState('0');
  const [userName, setUserName] = useState('Kerry Grinkmeyer');

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ticker.trim()) {
      setError('Please enter a stock ticker.');
      return;
    }

    setError(null);
    setLoading(true);

    const upperTicker = ticker.trim().toUpperCase();
    const analysisDate = new Date().toISOString().split('T')[0];
    let stockData = null;
    let reportData = null;
    let podcastAudio = null;

    try {
      // Step 1: Fetch stock data
      setStage('Fetching financial data...');
      const fetchRes = await fetch(`/api/fetch-stock-data?ticker=${upperTicker}`);
      if (!fetchRes.ok) {
        const err = await fetchRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch stock data');
      }
      stockData = await fetchRes.json();

      // Step 2: Generate report
      setStage('Samantha is generating your analysis...');
      const userInput = {
        ticker: upperTicker,
        price: price || (stockData.quote?.[0]?.price ?? stockData.quote?.price ?? ''),
        shares: Number(shares) || 0,
        portfolioPct: Number(portfolioPct) || 0,
        userName: userName || 'Investor',
        analysisDate,
      };

      const reportRes = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockData, userInput }),
      });
      if (!reportRes.ok) {
        const err = await reportRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate report');
      }
      reportData = await reportRes.json();

      // Step 3: Generate podcast
      if (reportData.podcastScript) {
        setStage('Creating Samantha\'s podcast...');
        try {
          const podcastRes = await fetch('/api/generate-podcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: reportData.podcastScript,
              ticker: upperTicker,
            }),
          });
          if (podcastRes.ok) {
            const podcastData = await podcastRes.json();
            podcastAudio = podcastData.audio; // base64 string
          }
        } catch (podErr) {
          console.warn('Podcast generation failed, continuing without audio:', podErr);
        }
      }

      // Step 4: Save report (store podcastAudio in report_json)
      setStage('Saving report...');
      const reportJsonWithAudio = { ...reportData };
      if (podcastAudio) {
        reportJsonWithAudio.podcastAudio = podcastAudio;
      }

      const inputPrice = price || reportData?.hero?.price || '';

      try {
        await fetch('/api/save-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker: upperTicker,
            companyName: reportData?.company?.name || upperTicker,
            analysisDate,
            userName,
            inputPrice,
            inputShares: Number(shares) || 0,
            inputPortfolioPct: Number(portfolioPct) || 0,
            reportJson: reportJsonWithAudio,
            podcastUrl: null,
          }),
        });
      } catch (saveErr) {
        console.warn('Save failed, navigating with local data:', saveErr);
      }

      // Step 5: Navigate to report page with data in location state
      navigate(`/report/${upperTicker}`, {
        state: {
          report: {
            ticker: upperTicker,
            company_name: reportData?.company?.name || upperTicker,
            analysis_date: analysisDate,
            user_name: userName,
            input_price: inputPrice,
            input_shares: Number(shares) || 0,
            input_portfolio_pct: Number(portfolioPct) || 0,
            report_json: reportJsonWithAudio,
            podcast_url: null,
          },
        },
      });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <div className="analyze-page">
      {loading && <LoadingOverlay stage={stage} />}

      <div className="analyze-header">
        <h1>Analyze a Stock</h1>
        <p>Enter a ticker and Samantha will generate a comprehensive analysis</p>
      </div>

      <div className="analyze-form-container">
        <Link to="/" className="form-back">&larr; Back to Directory</Link>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ticker">Stock Ticker</label>
            <input
              id="ticker"
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="e.g. AAPL"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Current Price (optional)</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Will be fetched if blank"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="shares">Shares Held</label>
              <input
                id="shares"
                type="number"
                min="0"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="portfolioPct">% of Portfolio</label>
              <input
                id="portfolioPct"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={portfolioPct}
                onChange={(e) => setPortfolioPct(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="userName">Your Name</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="analyze-submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Stock'}
          </button>
        </form>
      </div>
    </div>
  );
}
