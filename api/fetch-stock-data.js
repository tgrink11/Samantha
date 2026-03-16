// api/fetch-stock-data.js — Aggregates financial data from FMP and FRED APIs
const FMP_BASE = 'https://financialmodelingprep.com/api';
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function fmpFetch(path, apiKey) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${FMP_BASE}${path}${sep}apikey=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`FMP ${path} → ${resp.status}`);
  return resp.json();
}

async function fredFetch(seriesId, apiKey) {
  const url = `${FRED_BASE}?series_id=${seriesId}&sort_order=desc&limit=1&file_type=json&api_key=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`FRED ${seriesId} → ${resp.status}`);
  const data = await resp.json();
  return data.observations?.[0] ?? null;
}

export default async function handler(req, res) {
  corsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ticker = (req.query.ticker || '').trim().toUpperCase();
  if (!ticker) return res.status(400).json({ error: 'Missing required query param: ticker' });

  const fmpKey = process.env.FMP_KEY;
  const fredKey = process.env.FRED_KEY;
  if (!fmpKey) return res.status(500).json({ error: 'FMP_KEY not configured' });
  if (!fredKey) return res.status(500).json({ error: 'FRED_KEY not configured' });

  // Calculate date 3 years ago for historical prices
  const now = new Date();
  const threeYearsAgo = new Date(now);
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const fromDate = threeYearsAgo.toISOString().split('T')[0];

  try {
    // ── FMP requests (v3 endpoints) ─────────────────────────────────────
    const fmpEndpoints = {
      profile:              `/v3/profile/${ticker}`,
      quote:                `/v3/quote/${ticker}`,
      // Annual financials (for multi-year comparisons, Rule of 40, growth trends)
      incomeAnnual:         `/v3/income-statement/${ticker}?limit=4&period=annual`,
      balanceSheetAnnual:   `/v3/balance-sheet-statement/${ticker}?limit=4&period=annual`,
      cashFlowAnnual:       `/v3/cash-flow-statement/${ticker}?limit=4&period=annual`,
      // Quarterly financials (for recent quarter detail)
      incomeQuarterly:      `/v3/income-statement/${ticker}?limit=8&period=quarter`,
      balanceSheetQuarterly:`/v3/balance-sheet-statement/${ticker}?limit=4&period=quarter`,
      cashFlowQuarterly:    `/v3/cash-flow-statement/${ticker}?limit=4&period=quarter`,
      // Ratios & metrics (TTM + annual history)
      ratiosTTM:            `/v3/ratios-ttm/${ticker}`,
      ratiosAnnual:         `/v3/ratios/${ticker}?limit=4&period=annual`,
      keyMetricsTTM:        `/v3/key-metrics-ttm/${ticker}`,
      keyMetricsAnnual:     `/v3/key-metrics/${ticker}?limit=4&period=annual`,
      analystEstimates:     `/v3/analyst-estimates/${ticker}?limit=8`,
      analystConsensus:     `/v3/analyst-stock-recommendations/${ticker}`,
      upgradesDowngrades:   `/v4/upgrades-downgrades?symbol=${ticker}&limit=20`,
      institutionalOwn:     `/v3/institutional-holder/${ticker}`,
      insiderTrading:       `/v4/insider-trading?symbol=${ticker}&limit=20`,
      stockPeers:           `/v4/stock_peers?symbol=${ticker}`,
      historicalPrices:     `/v3/historical-price-full/${ticker}?from=${fromDate}`,
      rsi:                  `/v3/technical_indicator/daily/${ticker}?type=rsi&period=14`,
      sma50:                `/v3/technical_indicator/daily/${ticker}?type=sma&period=50`,
      sma200:               `/v3/technical_indicator/daily/${ticker}?type=sma&period=200`,
      enterpriseValue:      `/v3/enterprise-values/${ticker}?limit=4&period=annual`,
    };

    const fmpKeys = Object.keys(fmpEndpoints);
    const fmpPromises = fmpKeys.map(k => fmpFetch(fmpEndpoints[k], fmpKey));

    // ── FRED requests ─────────────────────────────────────────────────
    const fredSeries = ['DGS10', 'DGS2', 'DFF', 'CPIAUCSL'];
    const fredPromises = fredSeries.map(s => fredFetch(s, fredKey));

    // ── Execute all in parallel with fault tolerance ──────────────────
    const allResults = await Promise.allSettled([...fmpPromises, ...fredPromises]);

    // Map FMP results (log errors for debugging)
    const fmpData = {};
    const fmpErrors = {};
    fmpKeys.forEach((key, i) => {
      const r = allResults[i];
      if (r.status === 'fulfilled') {
        fmpData[key] = r.value;
      } else {
        fmpData[key] = null;
        fmpErrors[key] = r.reason?.message || String(r.reason);
        console.error(`FMP ${key} failed:`, r.reason?.message || r.reason);
      }
    });

    // Map FRED results
    const fredData = {};
    fredSeries.forEach((key, i) => {
      const r = allResults[fmpKeys.length + i];
      fredData[key] = r.status === 'fulfilled' ? r.value : null;
    });

    // ── Peer comparison data ──────────────────────────────────────────
    let peerComparisons = [];
    const peersRaw = fmpData.stockPeers;
    // stockPeers can return [{ symbol, peersList: [...] }] or just an array
    let peerList = [];
    if (Array.isArray(peersRaw) && peersRaw.length > 0) {
      peerList = peersRaw[0]?.peersList ?? peersRaw;
    }
    // Take first 4 peers (excluding self)
    const peers = peerList
      .filter(p => typeof p === 'string' && p.toUpperCase() !== ticker)
      .slice(0, 4);

    if (peers.length > 0) {
      const peerPromises = peers.flatMap(p => [
        fmpFetch(`/v3/quote/${p}`, fmpKey),
        fmpFetch(`/v3/ratios-ttm/${p}`, fmpKey),
      ]);
      const peerResults = await Promise.allSettled(peerPromises);
      for (let i = 0; i < peers.length; i++) {
        const quoteR = peerResults[i * 2];
        const ratiosR = peerResults[i * 2 + 1];
        peerComparisons.push({
          ticker: peers[i],
          quote: quoteR.status === 'fulfilled' ? quoteR.value : null,
          ratiosTTM: ratiosR.status === 'fulfilled' ? ratiosR.value : null,
        });
      }
    }

    // ── Trim bloated data to save prompt tokens ────────────────────────
    // Historical prices: sample to ~monthly (every 21 trading days) instead of daily
    let trimmedPrices = fmpData.historicalPrices;
    if (Array.isArray(trimmedPrices) && trimmedPrices.length > 50) {
      const sampled = [];
      for (let i = 0; i < trimmedPrices.length; i += 21) {
        sampled.push(trimmedPrices[i]);
      }
      // Always include the most recent and oldest
      if (sampled[0] !== trimmedPrices[0]) sampled.unshift(trimmedPrices[0]);
      trimmedPrices = sampled;
    } else if (trimmedPrices && typeof trimmedPrices === 'object' && Array.isArray(trimmedPrices.historical)) {
      // FMP sometimes returns { symbol, historical: [...] }
      const hist = trimmedPrices.historical;
      const sampled = [];
      for (let i = 0; i < hist.length; i += 21) {
        sampled.push(hist[i]);
      }
      if (sampled[0] !== hist[0]) sampled.unshift(hist[0]);
      trimmedPrices = { symbol: trimmedPrices.symbol, historical: sampled };
    }

    // Technical indicators: only keep latest value
    const latestRsi = Array.isArray(fmpData.rsi) ? fmpData.rsi.slice(0, 1) : fmpData.rsi;
    const latestSma50 = Array.isArray(fmpData.sma50) ? fmpData.sma50.slice(0, 1) : fmpData.sma50;
    const latestSma200 = Array.isArray(fmpData.sma200) ? fmpData.sma200.slice(0, 1) : fmpData.sma200;

    // ── Assemble response ─────────────────────────────────────────────
    const payload = {
      ticker,
      fetchedAt: new Date().toISOString(),
      profile: fmpData.profile,
      quote: fmpData.quote,
      incomeStatementsAnnual: fmpData.incomeAnnual,
      incomeStatementsQuarterly: fmpData.incomeQuarterly,
      balanceSheetAnnual: fmpData.balanceSheetAnnual,
      balanceSheetQuarterly: fmpData.balanceSheetQuarterly,
      cashFlowAnnual: fmpData.cashFlowAnnual,
      cashFlowQuarterly: fmpData.cashFlowQuarterly,
      ratiosTTM: fmpData.ratiosTTM,
      ratiosAnnual: fmpData.ratiosAnnual,
      keyMetricsTTM: fmpData.keyMetricsTTM,
      keyMetricsAnnual: fmpData.keyMetricsAnnual,
      analystEstimates: fmpData.analystEstimates,
      analystConsensus: fmpData.analystConsensus,
      upgradesDowngrades: fmpData.upgradesDowngrades,
      institutionalOwnership: fmpData.institutionalOwn,
      insiderTrading: fmpData.insiderTrading,
      stockPeers: fmpData.stockPeers,
      historicalPrices: trimmedPrices,
      technicals: {
        rsi: latestRsi,
        sma50: latestSma50,
        sma200: latestSma200,
      },
      enterpriseValue: fmpData.enterpriseValue,
      peerComparisons,
      macro: {
        treasury10y: fredData.DGS10,
        treasury2y: fredData.DGS2,
        fedFundsRate: fredData.DFF,
        cpi: fredData.CPIAUCSL,
      },
      // Debug: include any API errors (remove after debugging)
      _errors: Object.keys(fmpErrors).length > 0 ? fmpErrors : undefined,
    };

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('fetch-stock-data error:', err);
    return res.status(500).json({ error: 'Failed to fetch stock data', detail: err.message });
  }
}
