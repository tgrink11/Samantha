// api/generate-report.js - Sends financial data to Claude for AI stock analysis
// Self-contained: all prompt logic inlined to avoid cross-directory import issues in Vercel serverless

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

function corsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ── REPORT SCHEMA (inline copy of src/schema.js REPORT_SCHEMA_STRING) ────────
// This is the JSON structure Claude must return. Keep in sync with src/schema.js.
const REPORT_SCHEMA_STRING = JSON.stringify({
  company: {
    name: "string - full company name",
    ticker: "string - stock ticker symbol",
    exchange: "string - e.g. NASDAQ, NYSE",
    description: "string - 2-3 sentence company description",
    sector: "string - GICS sector",
    industry: "string - GICS industry"
  },
  hero: {
    price: "number - current stock price",
    priceChangeToday: "string - e.g. +1.25 (+0.82%)",
    marketCap: "number - raw market cap number",
    marketCapLabel: "string - formatted, e.g. $3.2T or $450B",
    week52Range: "string - e.g. $150.00 - $225.00",
    week52RangeNote: "string - context about where price sits in range",
    recommendation: "string - one of: BUY, HOLD, SELL",
    recommendationDetail: "string - 1-2 sentence justification"
  },
  executiveSummary: {
    takeaways: [
      { number: "number 1-3", title: "string - short headline", body: "string - 2-3 sentence explanation" }
    ]
  },
  quantitative: {
    healthGrades: {
      profitability: { grade: "string - A+ to F", detail: "string - rationale with specific metrics" },
      liquidity: { grade: "string - A+ to F", detail: "string - rationale with specific metrics" },
      solvency: { grade: "string - A+ to F", detail: "string - rationale with specific metrics" },
      efficiency: { grade: "string - A+ to F", detail: "string - rationale with specific metrics" }
    },
    ownership: {
      institutions: "string - percentage, e.g. 72.5%",
      public: "string - percentage, e.g. 25.8%",
      insiders: "string - percentage, e.g. 1.7%",
      commentary: "string - insight on ownership structure"
    },
    shortInterest: {
      sharesShort: "string - formatted number, e.g. 12.5M",
      shortPercentFloat: "string - percentage, e.g. 3.2%",
      shortRatio: "string - days to cover, e.g. 2.1 days",
      priorMonth: "string - prior month comparison, e.g. 13.1M",
      commentary: "string - what short interest signals"
    },
    balanceSheet: {
      items: [
        { label: "string - e.g. Total Cash", value: "string - formatted", detail: "string - context" }
      ],
      commentary: "string - overall balance sheet assessment"
    }
  },
  keyRatios: {
    rows: [
      { metric: "string - ratio name", current: "string", prior1: "string", prior2: "string", industryAvg: "string" }
    ],
    commentary: "string - key ratio insights (prefix with Valuation Context:)"
  },
  growth: {
    ruleOf40Score: "number - 3yr revenue CAGR + 3yr EPS CAGR",
    ruleOf40Max: 40,
    ruleOf40Commentary: "string - interpretation of Rule of 40",
    metrics: [
      { label: "string - metric name", value: "string - formatted value" }
    ],
    commentary: "string - growth analysis (prefix with Growth Analysis:)"
  },
  marketTAM: {
    title: "string - market opportunity title",
    totalTAM: "string - e.g. $500B by 2030",
    segments: [
      { name: "string", size: "string - formatted", description: "string" }
    ],
    commentary: "string - TAM analysis (prefix with Market Position:)"
  },
  peerComparison: {
    rows: [
      { company: "string", marketCap: "string", revenueGrowth: "string", grossMargin: "string", priceSales: "string", scale: "string" }
    ],
    commentary: "string - competitive analysis (prefix with Competitive Edge:)"
  },
  forecasts: {
    conservative: { assumptions: "string", jan2027: "string", jan2028: "string", jan2029: "string", threeYearROI: "string", meetsGoal: "boolean" },
    moderate: { assumptions: "string", jan2027: "string", jan2028: "string", jan2029: "string", threeYearROI: "string", meetsGoal: "boolean" },
    aggressive: { assumptions: "string", jan2027: "string", jan2028: "string", jan2029: "string", threeYearROI: "string", meetsGoal: "boolean" },
    commentary: "string - 100% ROI goal check (prefix with 100% ROI Goal Check:)"
  },
  riskDashboard: {
    volatility12m: "string - annualized volatility %",
    volatilityLabel: "string - Low/Moderate/High/Extreme",
    volatilityDetail: "string - what drives the volatility",
    beta: "string - beta vs S&P 500",
    betaDetail: "string - beta interpretation",
    maxDrawdown1y: "string - max drawdown %",
    maxDrawdownDetail: "string - when and what caused it",
    sharpeRatio: "string",
    sortinoRatio: "string",
    riskReturnInterpretation: "string - overall risk/return assessment",
    riskFactors: [
      { name: "string", severity: "string - High/Medium/Low", detail: "string" }
    ],
    technical: {
      currentPrice: "string", sma50: "string", sma50Note: "string - price vs SMA50",
      sma200: "string", sma200Note: "string - price vs SMA200",
      week52High: "string", week52HighNote: "string - distance from high",
      week52Low: "string", week52LowNote: "string - distance from low",
      avgVolume: "string", shortInterest: "string"
    },
    technicalAssessment: "string - overall technical outlook (prefix with Technical Assessment:)"
  },
  qualitative: {
    businessModel: "string - 2-3 sentences",
    managementQuality: "string - 2-3 sentences",
    competitiveMoat: "string - 2-3 sentences",
    regulatoryGeopolitical: "string - 2-3 sentences",
    rubricScore: { score: "number 1-10", max: 10, commentary: "string" }
  },
  callToAction: {
    recommendation: "string - full paragraph with **bold** for key phrases",
    stopLoss: "string - stop-loss level with reasoning",
    currentHolderGuidance: "string - advice for current holders",
    watchPoints: ["string - key events or levels to watch"]
  },
  investmentScore: {
    score: "number 1-100 - overall investment attractiveness",
    interpretation: "string - 1-2 sentences explaining the score"
  },
  podcastScript: "string - 800-1200 word podcast script as Samantha"
}, null, 2);

// ── SYSTEM PROMPT (inline copy of src/prompt.js buildSystemPrompt) ───────────
function buildSystemPrompt() {
  return [
    'You are Samantha, the AI Stock Analyst for Best of Us Investors.',
    'You were created by Kerry, the founder of Best of Us Investors, to help everyday investors make informed, data-driven decisions.',
    'You are warm, confident, and conversational — like a brilliant friend who happens to be a CFA charterholder with a PhD in behavioral finance.',
    'You never give wishy-washy answers. You take a clear stance backed by data, while always acknowledging risks.',
    'You speak directly to the user by their first name.',
    'You always ground your analysis in the quantitative data provided, but you also bring qualitative insight about business models, moats, and management quality.',
    'Your goal is to help the user decide whether a stock can deliver 100% ROI within 3 years — that is the Best of Us Investors standard.',
    '',
    'STRICT OUTPUT RULES:',
    '1. Return ONLY a single JSON object. No markdown, no preamble, no explanation outside the JSON.',
    '2. Do not wrap the JSON in code fences or backticks.',
    '3. Every string value must be plain text (no markdown formatting inside strings except **bold** markers in the callToAction.recommendation field).',
    '4. All numeric strings should include units or symbols (e.g. "$1.2B", "23.5%", "1.8x").',
    '5. Follow the exact field names and structure specified in the schema. Do not add or omit fields.',
    '6. The podcastScript field must be written as Samantha speaking directly to the user — conversational, warm, and insightful — covering the key findings in ~800-1200 words.',
  ].join('\n');
}

// ── HELPER: safe JSON stringify ──────────────────────────────────────────────
function safeStringify(obj, label) {
  try {
    const str = JSON.stringify(obj, null, 2);
    return str && str !== 'null' && str !== 'undefined' && str !== '{}' && str !== '[]'
      ? label + ':\n' + str
      : label + ': [No data available]';
  } catch {
    return label + ': [Data could not be serialized]';
  }
}

// ── USER PROMPT (inline copy of src/prompt.js buildUserPrompt) ───────────────
function buildUserPrompt(stockData, userInput) {
  const { ticker, price, shares, portfolioPct, userName, analysisDate } = userInput;

  const header = [
    '=== STOCK ANALYSIS REQUEST ===',
    'Analysis Date: ' + (analysisDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })),
    'User: ' + (userName || 'Investor'),
    'Ticker: ' + ticker,
    'Current Price: $' + (price || stockData?.quote?.[0]?.price || 'N/A'),
    shares ? 'Shares Held: ' + shares : null,
    portfolioPct ? 'Portfolio Weight: ' + portfolioPct + '%' : null,
    '',
  ].filter(Boolean).join('\n');

  const d = stockData || {};
  const dataBlocks = [
    safeStringify(d.profile, 'COMPANY PROFILE'),
    safeStringify(d.quote, 'REAL-TIME QUOTE'),
    safeStringify(d.incomeStatementsAnnual, 'INCOME STATEMENTS (Annual, last 4 years)'),
    safeStringify(d.incomeStatementsQuarterly, 'INCOME STATEMENTS (Quarterly, last 8 quarters)'),
    safeStringify(d.balanceSheetAnnual, 'BALANCE SHEET (Annual, last 4 years)'),
    safeStringify(d.balanceSheetQuarterly, 'BALANCE SHEET (Quarterly, last 4 quarters)'),
    safeStringify(d.cashFlowAnnual, 'CASH FLOW STATEMENT (Annual, last 4 years)'),
    safeStringify(d.cashFlowQuarterly, 'CASH FLOW STATEMENT (Quarterly, last 4 quarters)'),
    safeStringify(d.ratiosTTM, 'FINANCIAL RATIOS (TTM)'),
    safeStringify(d.ratiosAnnual, 'FINANCIAL RATIOS (Annual, last 4 years)'),
    safeStringify(d.keyMetricsTTM, 'KEY METRICS (TTM)'),
    safeStringify(d.keyMetricsAnnual, 'KEY METRICS (Annual, last 4 years)'),
    safeStringify(d.enterpriseValue, 'ENTERPRISE VALUE'),
    safeStringify(d.analystEstimates, 'ANALYST ESTIMATES (EPS & Revenue)'),
    safeStringify(d.analystConsensus, 'ANALYST RECOMMENDATIONS (Buy/Hold/Sell consensus)'),
    safeStringify(d.upgradesDowngrades, 'ANALYST GRADES (Recent upgrades/downgrades)'),
    safeStringify(d.institutionalOwnership, 'INSTITUTIONAL OWNERSHIP'),
    safeStringify(d.insiderTrading, 'INSIDER TRADING (Recent transactions)'),
    safeStringify(d.stockPeers, 'PEER COMPANIES'),
    safeStringify(d.peerComparisons, 'PEER COMPARISON DATA (Financials for each peer)'),
    safeStringify(d.historicalPrices, 'HISTORICAL DAILY PRICES (Last 3 years)'),
    safeStringify(d.technicals?.rsi, 'RSI (14-day)'),
    safeStringify(d.technicals?.sma50, 'SMA 50-DAY'),
    safeStringify(d.technicals?.sma200, 'SMA 200-DAY'),
    safeStringify(d.macro, 'MACRO DATA (FRED — Fed Funds Rate, CPI, 10Y Yield, 2Y Yield)'),
  ].join('\n\n');

  const analysisInstructions = `
=== ANALYSIS INSTRUCTIONS ===

CRITICAL RULES — READ FIRST:
1. You MUST populate EVERY field in EVERY section. Do NOT write "N/A", null, or empty strings for ANY field.
2. If exact data is missing, use the closest available data, calculate from related data, or provide your best estimate with a note.
3. The quote data (REAL-TIME QUOTE) contains: price, changesPercentage, change, dayLow, dayHigh, yearHigh, yearLow, marketCap, volume, avgVolume, eps, pe. USE THESE VALUES.
4. The ratios TTM data contains: peRatioTTM, pegRatioTTM, priceToBookRatioTTM, priceToSalesRatioTTM, returnOnEquityTTM, returnOnAssetsTTM, debtEquityRatioTTM, currentRatioTTM, etc. USE THESE VALUES for the "current" column in Key Ratios.
5. The annual ratios data contains the same ratios for prior years. Use these for prior1 and prior2 columns.
6. The key metrics TTM data contains: enterpriseValueOverEBITDATTM, marketCapTTM, peRatioTTM, etc. USE THESE VALUES.
7. Technical indicators (RSI, SMA 50, SMA 200) are provided in the data. Extract the numeric values from these.
8. Historical prices contain date, open, high, low, close, volume. Use these for volatility calculations and technical analysis.
9. For the podcast script: write the FULL 800-1200 word script. Do NOT truncate or abbreviate it.

Using ALL the data above, produce a comprehensive stock analysis report as a single JSON object.
Address the user as "${userName || 'Investor'}" throughout. The analysis date is ${analysisDate || 'today'}.

--- SECTION: company ---
Populate company name, ticker, exchange, a concise description (2-3 sentences), sector, and industry from the profile data.

--- SECTION: hero ---
- price: current stock price from the quote data
- priceChangeToday: format as "+X.XX (+Y.Y%)" or "-X.XX (-Y.Y%)" from quote data
- marketCap: raw number from quote/profile
- marketCapLabel: formatted (e.g. "$3.2T", "$450B", "$12.5B")
- week52Range: "$LOW - $HIGH" from quote data
- week52RangeNote: where current price sits relative to the range (e.g. "Trading 15% below 52-week high")
- recommendation: one of "BUY", "HOLD", or "SELL"
- recommendationDetail: 1-2 sentences explaining why

--- SECTION: executiveSummary ---
Provide exactly 3 takeaways. Each has a number (1-3), a short title, and a body (2-3 sentences).
These should be the 3 most important things the investor needs to know RIGHT NOW.
Focus on: (1) the strongest bull case, (2) the biggest risk or bear case, (3) whether the stock meets the 100% ROI in 3 years goal.

--- SECTION: quantitative ---
HEALTH GRADES (A+ through F for each — you MUST provide a grade and detail for ALL four):
- Profitability: Based on net margin, ROE, ROA, gross margin trends. A = exceptional profitability, F = unprofitable with deteriorating margins.
- Liquidity: Based on current ratio, quick ratio, cash position. A = fortress balance sheet, F = liquidity crisis risk.
- Solvency: Based on debt/equity, interest coverage, debt/EBITDA. A = minimal leverage, F = dangerous debt levels.
- Efficiency: Based on asset turnover, inventory turnover, receivables turnover. A = best-in-class efficiency, F = severe operational issues.
Each grade MUST include a detail string explaining the rationale with specific metrics from the data.
Even if some metrics are missing, use what is available to assign the best grade you can — NEVER leave these blank.

OWNERSHIP: Calculate institutional %, public/retail %, insider % from the institutional ownership and insider trading data provided.
If exact percentages are not directly available, estimate from the holder data and clearly state in the commentary that these are estimates.
You MUST populate institutions, public, and insiders fields with percentage strings — NEVER leave them as null or empty.
Provide commentary on what the ownership structure signals about institutional confidence.

SHORT INTEREST: Populate sharesShort (formatted like "28.5M"), shortPercentFloat (e.g. "3.2%"), shortRatio (days to cover, e.g. "2.1 days"), priorMonth comparison, and commentary.
Use data from the quote, key metrics, or your knowledge of the stock. If exact data is unavailable, provide your best estimate and note it in commentary.
You MUST populate all short interest fields — NEVER leave them as null or empty.

BALANCE SHEET: Extract 5-8 key items from the ANNUAL and QUARTERLY balance sheet data (cash & equivalents, total debt, stockholders equity, goodwill, current assets, current liabilities, etc.) with labels, formatted values, and trend context. Add overall commentary.

--- SECTION: keyRatios ---
Build a table of key ratios with current, prior1 (1 year ago), prior2 (2 years ago), and industryAvg columns.
Include at minimum: P/E (TTM), Forward P/E, PEG Ratio, Price/Book, Price/Sales, ROE, ROA, Debt/Equity, Current Ratio, EV/EBITDA.

DATA MAPPING FOR KEY RATIOS (use these exact fields from the data):
- "current" column: Use FINANCIAL RATIOS (TTM) data → peRatioTTM, pegRatioTTM, priceToBookRatioTTM, priceToSalesRatioTTM, returnOnEquityTTM, returnOnAssetsTTM, debtEquityRatioTTM, currentRatioTTM. Also use KEY METRICS (TTM) → enterpriseValueOverEBITDATTM for EV/EBITDA.
- "prior1" column: Use FINANCIAL RATIOS (Annual) array index [1] (second entry = 1 year ago).
- "prior2" column: Use FINANCIAL RATIOS (Annual) array index [2] (third entry = 2 years ago).
- "industryAvg": Use your knowledge of sector benchmarks.
- If a TTM ratio shows as 0 or very small, it may mean the company is unprofitable — display as "N/M" (not meaningful) with context, NOT "N/A".
- Format values as readable strings: "25.3x" for P/E, "1.2x" for P/B, "15.4%" for ROE, etc.

Commentary must start with "Valuation Context:" and analyze whether the stock is overvalued, fairly valued, or undervalued relative to growth and peers.

--- SECTION: growth ---
Kerry's Rule of 40: This is NOT the traditional SaaS Rule of 40. Kerry's version = 3-Year Revenue CAGR + 3-Year EPS CAGR.

DATA MAPPING FOR RULE OF 40:
- Use INCOME STATEMENTS (Annual) data. The array is sorted most recent first.
- Revenue CAGR: Calculate from revenue field across the annual income statements. Formula: ((latest_revenue / earliest_revenue)^(1/years) - 1) * 100
- EPS CAGR: Calculate from eps or epsdiluted field across annual income statements. If EPS went from negative to positive, use absolute values and note the turnaround.
- ruleOf40Score: The SUM of Revenue CAGR % + EPS CAGR %. Return as a NUMBER (e.g. 55.3), NOT a string.
- ruleOf40Max: Always the number 40.
- If a company has negative EPS in the base year, estimate CAGR based on the trend and note the limitation.
- NEVER return "N/A" for ruleOf40Score. Always calculate or estimate a number.

Metrics array should include (extract from QUARTERLY income statements for most recent quarter, ANNUAL for full year):
- Most recent quarter revenue growth YoY (compare Q revenue to same Q prior year)
- Full year revenue (most recent annual, formatted like "$1.2B")
- Forward guidance / estimates (from ANALYST ESTIMATES data)
- Gross margin (grossProfit / revenue from most recent period)
- EBITDA margin or EBITDA (from income statement or cash flow)
- Diluted EPS (epsdiluted from most recent quarter and YoY change)

Commentary must start with "Growth Analysis:" and discuss revenue acceleration/deceleration, margin trends, and EPS trajectory.

--- SECTION: marketTAM ---
title: A descriptive title for the market opportunity
totalTAM: Estimated total addressable market with timeframe
segments: Break TAM into 3-5 addressable segments with name, size estimate, and description of the company's position in each
Commentary must start with "Market Position:" and analyze market share, competitive position, and growth runway.
Use your knowledge of the industry to supplement — the data provides financials, you provide market context.

--- SECTION: peerComparison ---
Using the peer data provided (and your knowledge for any gaps), build a comparison table.
Include 5-8 peers (mix of US and global competitors).
Each row: company name, marketCap (formatted), revenueGrowth %, grossMargin %, priceSales ratio, scale descriptor (e.g. "Mega-cap leader", "Mid-cap challenger").
Commentary must start with "Competitive Edge:" and analyze what sets this company apart or where it falls short vs peers.

--- SECTION: forecasts ---
Build 3 scenarios for price targets at Jan 2027, Jan 2028, and Jan 2029:

Conservative: Assume margin compression, revenue deceleration, multiple contraction. What's the downside?
Moderate: Assume current trajectory continues with modest improvements. Base case.
Aggressive: Assume strong execution, market expansion, multiple expansion. Bull case.

For each scenario:
- assumptions: 1-2 sentences describing the scenario
- jan2027, jan2028, jan2029: projected stock prices as strings (e.g. "$185"). You MUST provide numeric price targets, NOT "N/A".
- threeYearROI: Calculate as ((jan2029_price - current_price) / current_price * 100). Format as "+145%" or "-20%". Use the current price from the REAL-TIME QUOTE data. NEVER return "N/A" — always calculate this number.
- meetsGoal: boolean — does this scenario achieve 100%+ ROI by Jan 2029? true or false, NEVER null.

Commentary must start with "100% ROI Goal Check:" and clearly state which scenarios meet the Best of Us Investors 100% ROI standard and what needs to happen for each.

--- SECTION: riskDashboard ---
VOLATILITY & RISK METRICS:
- volatility12m: Calculate or estimate annualized volatility from historical price data
- volatilityLabel: "Low" (<20%), "Moderate" (20-35%), "High" (35-50%), "Extreme" (>50%)
- volatilityDetail: Context on what drives the volatility
- beta: From key metrics or calculate from historical data vs S&P 500
- betaDetail: Interpretation (>1.5 = high beta, <0.8 = defensive, etc.)
- maxDrawdown1y: Largest peak-to-trough decline in last 12 months
- maxDrawdownDetail: When it happened and what caused it
- sharpeRatio: Risk-adjusted return (from key metrics or estimate)
- sortinoRatio: Downside risk-adjusted return (from key metrics or estimate)
- riskReturnInterpretation: 1-2 sentences on overall risk/return profile

RISK FACTORS: Identify 4-6 key risk factors. Each has name, severity ("High"/"Medium"/"Low"), and detail.
Include company-specific, industry, macro, and regulatory risks.

TECHNICAL ANALYSIS — DATA MAPPING:
- currentPrice: Use the "price" field from REAL-TIME QUOTE data. Format as "$XX.XX".
- sma50: Extract the numeric "sma" value from SMA 50-DAY data (it's in the first element of the array). Format as "$XX.XX".
- sma200: Extract the numeric "sma" value from SMA 200-DAY data. Format as "$XX.XX".
- sma50Note / sma200Note: Compare currentPrice to the SMA value (e.g. "Trading 5% above 50-day SMA").
- week52High: Use "yearHigh" from REAL-TIME QUOTE data. Format as "$XX.XX".
- week52Low: Use "yearLow" from REAL-TIME QUOTE data. Format as "$XX.XX".
- week52HighNote / week52LowNote: Calculate % distance from current price to high/low.
- avgVolume: Use "avgVolume" from REAL-TIME QUOTE data. Format as "XXM" or "XX.XM".
- shortInterest: Use short interest data from the quantitative section.
- technicalAssessment must start with "Technical Assessment:" and provide an overall technical outlook. Use RSI data (RSI > 70 = overbought, < 30 = oversold), moving average crossovers, and volume patterns.
- NEVER leave currentPrice, sma50, sma200, week52High, or week52Low as null or N/A. The data IS in the quote and technical indicator sections.

--- SECTION: qualitative ---
- businessModel: 2-3 sentences on how the company makes money and the durability of the model
- managementQuality: 2-3 sentences on management track record, capital allocation, and alignment with shareholders
- competitiveMoat: 2-3 sentences on sustainable competitive advantages (network effects, switching costs, IP, scale, brand)
- regulatoryGeopolitical: 2-3 sentences on regulatory risks, geopolitical exposure, and policy sensitivity
- rubricScore: A confidence score from 1-10 (10 = highest confidence in the analysis). max is always 10. Commentary explains what drives the confidence level up or down.

--- SECTION: callToAction ---
- recommendation: A full paragraph recommendation. Use **bold** markers for key phrases (e.g. "**BUY** with a 3-year horizon"). Be specific about entry strategy, position sizing considerations, and timeline.
- stopLoss: Suggested stop-loss level with rationale (e.g. "Set stop-loss at $XX (-15% from current) — below the 200-day SMA and key support at $YY")
- currentHolderGuidance: Specific advice for investors who already own the stock (hold, add, trim, etc.)
- watchPoints: Array of 4-6 strings — specific catalysts, earnings dates, macro events, technical levels to monitor

--- SECTION: investmentScore ---
- score: A single number 1-100 representing overall investment attractiveness
  - 80-100: Strong Buy — compelling risk/reward, high conviction
  - 60-79: Buy — favorable outlook with manageable risks
  - 40-59: Hold — mixed signals, wait for clarity
  - 20-39: Underperform — significant concerns outweigh positives
  - 1-19: Sell — deteriorating fundamentals, poor risk/reward
- interpretation: 1-2 sentences explaining the score

--- SECTION: podcastScript ---
Write a podcast script as Samantha speaking directly to ${userName || 'the investor'}.
This will be converted to audio via text-to-speech, so:
- Write conversationally, as if speaking to a friend
- Use natural speech patterns (contractions, rhetorical questions, emphasis)
- Do NOT use markdown, bullet points, or formatting — pure flowing text
- Address the user by name at least 2-3 times
- Length: 800-1200 words (targets ~5-8 minutes of speech)
- Structure: Open with a hook, cover the key findings, discuss the bull and bear cases, give the recommendation, close with the 100% ROI assessment and a sign-off
- Sign off with something like "This is Samantha, your AI analyst at Best of Us Investors. Live Loud!"

=== END OF INSTRUCTIONS ===

RESPONSE SCHEMA (you MUST match this structure exactly):
${REPORT_SCHEMA_STRING}

Return ONLY the JSON object. No other text.`;

  return header + '\n' + dataBlocks + '\n\n' + analysisInstructions;
}

// ── HANDLER ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  corsHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_KEY not configured" });

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  let { stockData, userInput } = body || {};
  if (!stockData) return res.status(400).json({ error: "Missing stockData in request body" });
  if (!userInput || !userInput.ticker) return res.status(400).json({ error: "Missing userInput.ticker in request body" });

  // Strip debug fields and trim large arrays to keep prompt within token limits
  if (stockData._errors) delete stockData._errors;
  if (stockData.fetchedAt) delete stockData.fetchedAt;
  if (stockData.ticker) delete stockData.ticker;

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(stockData, userInput);

  // Log prompt size for debugging
  const promptChars = systemPrompt.length + userPrompt.length;
  console.log(`[generate-report] ticker=${userInput.ticker}, prompt size=${promptChars} chars (~${Math.round(promptChars / 4)} tokens)`);

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 32000,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);
      return res.status(502).json({
        error: "Claude API request failed",
        status: response.status,
        detail: errBody,
      });
    }

    const result = await response.json();

    // Log stop reason — if "max_tokens", the response was truncated
    const stopReason = result?.stop_reason || 'unknown';
    const inputTokens = result?.usage?.input_tokens || '?';
    const outputTokens = result?.usage?.output_tokens || '?';
    console.log(`[generate-report] stop_reason=${stopReason}, input_tokens=${inputTokens}, output_tokens=${outputTokens}`);

    if (stopReason === 'max_tokens') {
      console.warn(`[generate-report] WARNING: Response truncated at max_tokens! Output used ${outputTokens} tokens.`);
    }

    const rawText = (result && result.content && result.content[0] && result.content[0].text) || "";

    // Strip markdown code blocks if present
    let jsonStr = rawText;
    const tick = String.fromCharCode(96);
    const codeBlockRegex = new RegExp(tick + tick + tick + "(?:json)?\\s*\\n?([\\s\\S]*?)\\n?\\s*" + tick + tick + tick);
    const codeBlockMatch = jsonStr.match(codeBlockRegex);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }
    jsonStr = jsonStr.trim();

    // Find first { and last }
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }

    let report;
    try {
      report = JSON.parse(jsonStr);
    } catch (parseErr) {
      // If truncated, try to repair by closing open strings/braces
      if (stopReason === 'max_tokens') {
        console.warn('[generate-report] Attempting to repair truncated JSON...');
        let repaired = jsonStr;
        // Close any unclosed string
        const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
        if (quoteCount % 2 !== 0) repaired += '"';
        // Count open vs close braces/brackets and close them
        let openBraces = 0, openBrackets = 0;
        for (const ch of repaired) {
          if (ch === '{') openBraces++;
          else if (ch === '}') openBraces--;
          else if (ch === '[') openBrackets++;
          else if (ch === ']') openBrackets--;
        }
        while (openBrackets > 0) { repaired += ']'; openBrackets--; }
        while (openBraces > 0) { repaired += '}'; openBraces--; }
        try {
          report = JSON.parse(repaired);
          console.log('[generate-report] Truncated JSON repaired successfully');
        } catch (repairErr) {
          console.error("Failed to repair truncated JSON:", repairErr.message);
          return res.status(502).json({
            error: "AI response was truncated and could not be repaired. Try a smaller ticker.",
            rawPreview: rawText.slice(0, 500),
          });
        }
      } else {
        console.error("Failed to parse Claude response as JSON:", parseErr.message);
        return res.status(502).json({
          error: "Failed to parse AI response as JSON",
          rawPreview: rawText.slice(0, 500),
        });
      }
    }

    return res.status(200).json(report);
  } catch (err) {
    console.error("generate-report error:", err);
    return res.status(500).json({ error: "Report generation failed", detail: err.message });
  }
}
