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
    // ── FMP requests ──────────────────────────────────────────────────
    const fmpEndpoints = {
      profile:           `/stable/profile?symbol=${ticker}`,
      quote:             `/stable/quote?symbol=${ticker}`,
      income:            `/stable/income-statement?symbol=${ticker}&limit=12&period=quarter`,
      balanceSheet:      `/stable/balance-sheet-statement?symbol=${ticker}&limit=4&period=quarter`,
      cashFlow:          `/stable/cash-flow-statement?symbol=${ticker}&limit=4&period=quarter`,
      ratiosTTM:         `/stable/ratios-ttm?symbol=${ticker}`,
      keyMetricsTTM:     `/stable/key-metrics-ttm?symbol=${ticker}`,
      analystEstimates:  `/stable/analyst-estimates?symbol=${ticker}&limit=8`,
      analystConsensus:  `/stable/analyst-stock-recommendations?symbol=${ticker}`,
      upgradesDowngrades:`/stable/upgrades-downgrades?symbol=${ticker}&limit=20`,
      institutionalOwn:  `/stable/institutional-ownership/extract-analytics/holder?symbol=${ticker}`,
      insiderTrading:    `/stable/insider-trading?symbol=${ticker}&limit=20`,
      stockPeers:        `/stable/stock-peers?symbol=${ticker}`,
      historicalPrices:  `/stable/historical-price-eod/full?symbol=${ticker}&from=${fromDate}`,
      rsi:               `/stable/technical-indicators/rsi?symbol=${ticker}&periodLength=14&timeframe=1day`,
      sma50:             `/stable/technical-indicators/sma?symbol=${ticker}&periodLength=50&timeframe=1day`,
      sma200:            `/stable/technical-indicators/sma?symbol=${ticker}&periodLength=200&timeframe=1day`,
      enterpriseValue:   `/stable/enterprise-value?symbol=${ticker}&limit=4&period=quarter`,
    };

    const fmpKeys = Object.keys(fmpEndpoints);
    const fmpPromises = fmpKeys.map(k => fmpFetch(fmpEndpoints[k], fmpKey));

    // ── FRED requests ─────────────────────────────────────────────────
    const fredSeries = ['DGS10', 'DGS2', 'DFF', 'CPIAUCSL'];
    const fredPromises = fredSeries.map(s => fredFetch(s, fredKey));

    // ── Execute all in parallel with fault tolerance ──────────────────
    const allResults = await Promise.allSettled([...fmpPromises, ...fredPromises]);

    // Map FMP results
    const fmpData = {};
    fmpKeys.forEach((key, i) => {
      const r = allResults[i];
      fmpData[key] = r.status === 'fulfilled' ? r.value : null;
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
        fmpFetch(`/stable/quote?symbol=${p}`, fmpKey),
        fmpFetch(`/stable/ratios-ttm?symbol=${p}`, fmpKey),
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

    // ── Assemble response ─────────────────────────────────────────────
    const payload = {
      ticker,
      fetchedAt: new Date().toISOString(),
      profile: fmpData.profile,
      quote: fmpData.quote,
      incomeStatements: fmpData.income,
      balanceSheet: fmpData.balanceSheet,
      cashFlow: fmpData.cashFlow,
      ratiosTTM: fmpData.ratiosTTM,
      keyMetricsTTM: fmpData.keyMetricsTTM,
      analystEstimates: fmpData.analystEstimates,
      analystConsensus: fmpData.analystConsensus,
      upgradesDowngrades: fmpData.upgradesDowngrades,
      institutionalOwnership: fmpData.institutionalOwn,
      insiderTrading: fmpData.insiderTrading,
      stockPeers: fmpData.stockPeers,
      historicalPrices: fmpData.historicalPrices,
      technicals: {
        rsi: fmpData.rsi,
        sma50: fmpData.sma50,
        sma200: fmpData.sma200,
      },
      enterpriseValue: fmpData.enterpriseValue,
      peerComparisons,
      macro: {
        treasury10y: fredData.DGS10,
        treasury2y: fredData.DGS2,
        fedFundsRate: fredData.DFF,
        cpi: fredData.CPIAUCSL,
      },
    };

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('fetch-stock-data error:', err);
    return res.status(500).json({ error: 'Failed to fetch stock data', detail: err.message });
  }
}
