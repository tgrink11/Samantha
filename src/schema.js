// schema.js — Report schema for Samantha Stock Analyst
// Defines the expected JSON structure returned by Claude's analysis.
// Used in the prompt (to instruct Claude) and in the frontend (to parse results).

export const REPORT_SCHEMA = {
  company: {
    name:        { type: 'string', desc: 'Full company name' },
    ticker:      { type: 'string', desc: 'Stock ticker symbol' },
    exchange:    { type: 'string', desc: 'Primary exchange (e.g. NASDAQ, NYSE)' },
    description: { type: 'string', desc: 'One-paragraph company description' },
    sector:      { type: 'string', desc: 'GICS sector' },
    industry:    { type: 'string', desc: 'GICS industry' },
  },

  hero: {
    price:              { type: 'number', desc: 'Current stock price' },
    priceChangeToday:   { type: 'string', desc: 'Today change, e.g. "+2.34 (+1.5%)"' },
    marketCap:          { type: 'number', desc: 'Market cap in raw number' },
    marketCapLabel:     { type: 'string', desc: 'Formatted market cap, e.g. "$3.2T"' },
    week52Range:        { type: 'string', desc: '52-week range, e.g. "$85.62 - $153.13"' },
    week52RangeNote:    { type: 'string', desc: 'Context note on where price sits in range' },
    recommendation:     { type: 'string', desc: 'BUY / HOLD / SELL' },
    recommendationDetail: { type: 'string', desc: '1-2 sentence recommendation rationale' },
  },

  executiveSummary: {
    takeaways: {
      type: 'array',
      items: {
        number: { type: 'number', desc: 'Takeaway number (1, 2, or 3)' },
        title:  { type: 'string', desc: 'Short takeaway title' },
        body:   { type: 'string', desc: 'Detailed takeaway explanation (2-3 sentences)' },
      },
      desc: 'Exactly 3 takeaways',
    },
  },

  quantitative: {
    healthGrades: {
      profitability: {
        grade:  { type: 'string', desc: 'Letter grade A through F' },
        detail: { type: 'string', desc: 'Supporting rationale with key metrics' },
      },
      liquidity: {
        grade:  { type: 'string', desc: 'Letter grade A through F' },
        detail: { type: 'string', desc: 'Supporting rationale with key metrics' },
      },
      solvency: {
        grade:  { type: 'string', desc: 'Letter grade A through F' },
        detail: { type: 'string', desc: 'Supporting rationale with key metrics' },
      },
      efficiency: {
        grade:  { type: 'string', desc: 'Letter grade A through F' },
        detail: { type: 'string', desc: 'Supporting rationale with key metrics' },
      },
    },
    ownership: {
      institutions: { type: 'string', desc: 'Institutional ownership %, e.g. "73.2%"' },
      public:       { type: 'string', desc: 'Public/retail ownership %, e.g. "25.1%"' },
      insiders:     { type: 'string', desc: 'Insider ownership %, e.g. "1.7%"' },
      commentary:   { type: 'string', desc: 'Interpretation of ownership structure' },
    },
    shortInterest: {
      sharesShort:       { type: 'string', desc: 'Total shares short, e.g. "28.5M"' },
      shortPercentFloat: { type: 'string', desc: 'Short % of float, e.g. "1.2%"' },
      shortRatio:        { type: 'string', desc: 'Days to cover, e.g. "1.8 days"' },
      priorMonth:        { type: 'string', desc: 'Prior month comparison, e.g. "29.1M"' },
      commentary:        { type: 'string', desc: 'Short interest interpretation' },
    },
    balanceSheet: {
      items: {
        type: 'array',
        items: {
          label:  { type: 'string', desc: 'Balance sheet line item name' },
          value:  { type: 'string', desc: 'Formatted value' },
          detail: { type: 'string', desc: 'Context or trend note' },
        },
        desc: 'Key balance sheet items (cash, debt, equity, etc.)',
      },
      commentary: { type: 'string', desc: 'Overall balance sheet assessment' },
    },
  },

  keyRatios: {
    rows: {
      type: 'array',
      items: {
        metric:      { type: 'string', desc: 'Ratio name (P/E, PEG, P/B, ROE, D/E, etc.)' },
        current:     { type: 'string', desc: 'Current period value' },
        prior1:      { type: 'string', desc: 'Prior year value' },
        prior2:      { type: 'string', desc: 'Two years ago value' },
        industryAvg: { type: 'string', desc: 'Industry average for comparison' },
      },
      desc: 'Array of key ratio rows with trend data',
    },
    commentary: { type: 'string', desc: 'Valuation context analysis (prefix with "Valuation Context:")' },
  },

  growth: {
    ruleOf40Score:      { type: 'string', desc: 'Kerry Rule of 40 score = Rev CAGR + EPS CAGR' },
    ruleOf40Max:        { type: 'string', desc: 'Always "40"' },
    ruleOf40Commentary: { type: 'string', desc: 'Interpretation of Rule of 40 result' },
    metrics: {
      type: 'array',
      items: {
        label: { type: 'string', desc: 'Metric name (e.g. "Q4 Revenue Growth YoY")' },
        value: { type: 'string', desc: 'Metric value' },
      },
      desc: 'Growth metrics: Q4 rev growth, full year rev, guidance, gross margin, EBITDA, diluted EPS',
    },
    commentary: { type: 'string', desc: 'Growth analysis (prefix with "Growth Analysis:")' },
  },

  marketTAM: {
    title:    { type: 'string', desc: 'Market opportunity title' },
    totalTAM: { type: 'string', desc: 'Total addressable market size, e.g. "$850B by 2030"' },
    segments: {
      type: 'array',
      items: {
        name:        { type: 'string', desc: 'Market segment name' },
        size:        { type: 'string', desc: 'Segment TAM size' },
        description: { type: 'string', desc: 'Segment description and company position' },
      },
      desc: 'TAM broken into addressable segments',
    },
    commentary: { type: 'string', desc: 'Market position analysis (prefix with "Market Position:")' },
  },

  peerComparison: {
    rows: {
      type: 'array',
      items: {
        company:       { type: 'string', desc: 'Peer company name' },
        marketCap:     { type: 'string', desc: 'Peer market cap formatted' },
        revenueGrowth: { type: 'string', desc: 'Peer revenue growth %' },
        grossMargin:   { type: 'string', desc: 'Peer gross margin %' },
        priceSales:    { type: 'string', desc: 'Peer P/S ratio' },
        scale:         { type: 'string', desc: 'Relative scale descriptor' },
      },
      desc: 'US and global peer comparison rows',
    },
    commentary: { type: 'string', desc: 'Competitive edge analysis (prefix with "Competitive Edge:")' },
  },

  forecasts: {
    conservative: {
      assumptions:  { type: 'string', desc: 'Conservative scenario assumptions' },
      jan2027:      { type: 'string', desc: 'Projected price Jan 2027' },
      jan2028:      { type: 'string', desc: 'Projected price Jan 2028' },
      jan2029:      { type: 'string', desc: 'Projected price Jan 2029' },
      threeYearROI: { type: 'string', desc: '3-year ROI %' },
      meetsGoal:    { type: 'boolean', desc: 'Whether this scenario meets 100% ROI in 3 years' },
    },
    moderate: {
      assumptions:  { type: 'string', desc: 'Moderate scenario assumptions' },
      jan2027:      { type: 'string', desc: 'Projected price Jan 2027' },
      jan2028:      { type: 'string', desc: 'Projected price Jan 2028' },
      jan2029:      { type: 'string', desc: 'Projected price Jan 2029' },
      threeYearROI: { type: 'string', desc: '3-year ROI %' },
      meetsGoal:    { type: 'boolean', desc: 'Whether this scenario meets 100% ROI in 3 years' },
    },
    aggressive: {
      assumptions:  { type: 'string', desc: 'Aggressive scenario assumptions' },
      jan2027:      { type: 'string', desc: 'Projected price Jan 2027' },
      jan2028:      { type: 'string', desc: 'Projected price Jan 2028' },
      jan2029:      { type: 'string', desc: 'Projected price Jan 2029' },
      threeYearROI: { type: 'string', desc: '3-year ROI %' },
      meetsGoal:    { type: 'boolean', desc: 'Whether this scenario meets 100% ROI in 3 years' },
    },
    commentary: { type: 'string', desc: '100% ROI goal check analysis (prefix with "100% ROI Goal Check:")' },
  },

  riskDashboard: {
    volatility12m:       { type: 'string', desc: 'Annualized 12-month volatility %' },
    volatilityLabel:     { type: 'string', desc: 'Label: "Low" / "Moderate" / "High" / "Extreme"' },
    volatilityDetail:    { type: 'string', desc: 'Volatility context and interpretation' },
    beta:                { type: 'string', desc: 'Beta relative to S&P 500' },
    betaDetail:          { type: 'string', desc: 'Beta interpretation' },
    maxDrawdown1y:       { type: 'string', desc: 'Max drawdown over trailing 1 year' },
    maxDrawdownDetail:   { type: 'string', desc: 'Drawdown context' },
    sharpeRatio:         { type: 'string', desc: 'Sharpe ratio' },
    sortinoRatio:        { type: 'string', desc: 'Sortino ratio' },
    riskReturnInterpretation: { type: 'string', desc: 'Risk-adjusted return assessment' },
    riskFactors: {
      type: 'array',
      items: {
        name:     { type: 'string', desc: 'Risk factor name' },
        severity: { type: 'string', desc: '"High", "Medium", or "Low"' },
        detail:   { type: 'string', desc: 'Risk factor explanation' },
      },
      desc: 'Key risk factors with severity ratings',
    },
    technical: {
      currentPrice:   { type: 'string', desc: 'Current price formatted' },
      sma50:          { type: 'string', desc: '50-day SMA value' },
      sma50Note:      { type: 'string', desc: 'Price vs SMA50 interpretation' },
      sma200:         { type: 'string', desc: '200-day SMA value' },
      sma200Note:     { type: 'string', desc: 'Price vs SMA200 interpretation' },
      week52High:     { type: 'string', desc: '52-week high price' },
      week52HighNote: { type: 'string', desc: 'Distance from 52-week high' },
      week52Low:      { type: 'string', desc: '52-week low price' },
      week52LowNote:  { type: 'string', desc: 'Distance from 52-week low' },
      avgVolume:      { type: 'string', desc: 'Average daily volume' },
      shortInterest:  { type: 'string', desc: 'Short interest summary' },
    },
    technicalAssessment: { type: 'string', desc: 'Overall technical assessment (prefix with "Technical Assessment:")' },
  },

  qualitative: {
    businessModel:          { type: 'string', desc: 'Business model analysis (2-3 sentences)' },
    managementQuality:      { type: 'string', desc: 'Management quality assessment (2-3 sentences)' },
    competitiveMoat:        { type: 'string', desc: 'Competitive moat analysis (2-3 sentences)' },
    regulatoryGeopolitical: { type: 'string', desc: 'Regulatory and geopolitical risk assessment (2-3 sentences)' },
    rubricScore: {
      score:      { type: 'number', desc: 'Confidence score 1-10' },
      max:        { type: 'number', desc: 'Always 10' },
      commentary: { type: 'string', desc: 'Rubric score justification' },
    },
  },

  callToAction: {
    recommendation:        { type: 'string', desc: 'Full recommendation text with bold markers for emphasis' },
    stopLoss:              { type: 'string', desc: 'Suggested stop-loss level and rationale' },
    currentHolderGuidance: { type: 'string', desc: 'Guidance for existing holders' },
    watchPoints: {
      type: 'array',
      items: { type: 'string' },
      desc: 'Key events or levels to watch',
    },
  },

  investmentScore: {
    score:          { type: 'number', desc: 'Overall investment score 1-100' },
    interpretation: { type: 'string', desc: 'Score interpretation and context' },
  },

  podcastScript: {
    type: 'string',
    desc: 'Full podcast script for TTS (~800-1200 words, ~5-8 min audio). Written as Samantha speaking conversationally to the user by name. Covers key findings, recommendation, risks, and outlook.',
  },
};

// ── Build a human-readable schema string for embedding in the prompt ─────────
function formatSchemaNode(node, indent) {
  const pad = '  '.repeat(indent);

  // Leaf node with type
  if (node.type && typeof node.type === 'string' && node.type !== 'array') {
    return node.type + (node.desc ? ' -- ' + node.desc : '');
  }

  // Array node
  if (node.type === 'array') {
    const itemStr = formatSchemaNode(node.items, indent + 1);
    const desc = node.desc ? ' // ' + node.desc : '';
    if (typeof itemStr === 'string' && !itemStr.includes('\n')) {
      return '[{ ' + itemStr + ' }]' + desc;
    }
    return '[' + desc + '\n' + pad + '  {\n' + itemStr + '\n' + pad + '  }\n' + pad + ']';
  }

  // Object node -- iterate keys
  const lines = [];
  for (const [key, val] of Object.entries(node)) {
    if (key === 'type' || key === 'desc') continue;
    const formatted = formatSchemaNode(val, indent + 1);
    if (typeof formatted === 'string' && !formatted.includes('\n')) {
      lines.push(pad + '  ' + key + ': ' + formatted);
    } else {
      lines.push(pad + '  ' + key + ': {\n' + formatted + '\n' + pad + '  }');
    }
  }
  return lines.join(',\n');
}

export const REPORT_SCHEMA_STRING = '{\n' + formatSchemaNode(REPORT_SCHEMA, 0) + '\n}';
