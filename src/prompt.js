// prompt.js — Prompt builder for Samantha Stock Analyst
// Constructs the system and user prompts for Claude's stock analysis.
// Imports the schema string so Claude knows exactly what JSON shape to return.

import { REPORT_SCHEMA_STRING } from './schema.js';

// ── SYSTEM PROMPT ───────────────────────────────────────────────────────────
// Sets Samantha's persona and ground rules. Sent as the "system" field.
export function buildSystemPrompt() {
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

// ── HELPER: safe JSON stringify that handles circular refs & undefined ───────
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

// ── USER PROMPT ─────────────────────────────────────────────────────────────
// Contains all the financial data + the full analysis instructions.
// Sent as the "user" message content.
export function buildUserPrompt(stockData, userInput) {
  const { ticker, price, shares, portfolioPct, userName, analysisDate } = userInput;

  // ── Section 1: Context header ─────────────────────────────────────────────
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

  // ── Section 2: All financial data ─────────────────────────────────────────
  // Property names must match the response from api/fetch-stock-data.js
  const d = stockData || {};
  const dataBlocks = [
    safeStringify(d.profile, 'COMPANY PROFILE'),
    safeStringify(d.quote, 'REAL-TIME QUOTE'),
    safeStringify(d.incomeStatements, 'INCOME STATEMENTS (Quarterly, last 12 quarters)'),
    safeStringify(d.balanceSheet, 'BALANCE SHEET (Quarterly, last 4 quarters)'),
    safeStringify(d.cashFlow, 'CASH FLOW STATEMENT (Quarterly, last 4 quarters)'),
    safeStringify(d.ratiosTTM, 'FINANCIAL RATIOS (TTM)'),
    safeStringify(d.keyMetricsTTM, 'KEY METRICS (TTM)'),
    safeStringify(d.enterpriseValue, 'ENTERPRISE VALUE'),
    safeStringify(d.analystEstimates, 'ANALYST ESTIMATES (EPS & Revenue)'),
    safeStringify(d.analystConsensus, 'ANALYST RECOMMENDATIONS (Buy/Hold/Sell consensus)'),
    safeStringify(d.upgradesDowngrades, 'ANALYST GRADES (Recent upgrades/downgrades)'),
    safeStringify(d.institutionalOwnership, 'TOP INSTITUTIONAL HOLDERS'),
    safeStringify(d.insiderTrading, 'INSIDER TRADING (Recent transactions)'),
    safeStringify(d.stockPeers, 'PEER COMPANIES'),
    safeStringify(d.peerComparisons, 'PEER COMPARISON DATA (Financials for each peer)'),
    safeStringify(d.historicalPrices, 'HISTORICAL DAILY PRICES (Last 3 years)'),
    safeStringify(d.technicals?.rsi, 'RSI (14-day)'),
    safeStringify(d.technicals?.sma50, 'SMA 50-DAY'),
    safeStringify(d.technicals?.sma200, 'SMA 200-DAY'),
    safeStringify(d.macro, 'MACRO DATA (FRED — Fed Funds Rate, CPI, 10Y Treasury, 2Y Treasury)'),
  ].join('\n\n');

  // ── Section 3: Master analysis prompt ─────────────────────────────────────
  const analysisInstructions = `
=== ANALYSIS INSTRUCTIONS ===

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
HEALTH GRADES (A through F for each):
- Profitability: Based on net margin, ROE, ROA, gross margin trends. A = exceptional profitability, F = unprofitable with deteriorating margins.
- Liquidity: Based on current ratio, quick ratio, cash position. A = fortress balance sheet, F = liquidity crisis risk.
- Solvency: Based on debt/equity, interest coverage, debt/EBITDA. A = minimal leverage, F = dangerous debt levels.
- Efficiency: Based on asset turnover, inventory turnover, receivables turnover. A = best-in-class efficiency, F = severe operational issues.
Each grade must include a detail string explaining the rationale with specific metrics.

OWNERSHIP: Calculate institutional %, public %, insider % from holder data. Provide commentary on what the ownership structure signals.

SHORT INTEREST: sharesShort (formatted like "28.5M"), shortPercentFloat, shortRatio (days to cover), priorMonth comparison, and commentary.

BALANCE SHEET: Extract 5-8 key items (cash & equivalents, total debt, stockholders equity, goodwill, current assets, current liabilities, etc.) with labels, formatted values, and trend context. Add overall commentary.

--- SECTION: keyRatios ---
Build a table of key ratios with current, prior1 (1 year ago), prior2 (2 years ago), and industryAvg columns.
Include at minimum: P/E (TTM), Forward P/E, PEG Ratio, Price/Book, Price/Sales, ROE, ROA, Debt/Equity, Current Ratio, EV/EBITDA.
Use the ratios and key metrics data to fill these. For industry averages, use reasonable sector benchmarks from your knowledge if not in the data.
Commentary must start with "Valuation Context:" and analyze whether the stock is overvalued, fairly valued, or undervalued relative to growth and peers.

--- SECTION: growth ---
Kerry's Rule of 40: This is NOT the traditional SaaS Rule of 40. Kerry's version = 3-Year Revenue CAGR + 3-Year EPS CAGR.
Calculate both CAGRs from the income statement data. The sum is the ruleOf40Score. ruleOf40Max is always "40".
If the sum exceeds 40, the company passes. Provide ruleOf40Commentary explaining the result.

Metrics array should include:
- Most recent quarter revenue growth YoY
- Full year revenue (most recent)
- Forward guidance / estimates (from analyst estimates)
- Gross margin (most recent)
- EBITDA margin or EBITDA (most recent)
- Diluted EPS (most recent quarter and YoY change)

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
- jan2027, jan2028, jan2029: projected stock prices as strings (e.g. "$185")
- threeYearROI: percentage return from current price to Jan 2029 price (e.g. "+145%")
- meetsGoal: boolean — does this scenario achieve 100%+ ROI by Jan 2029?

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

TECHNICAL ANALYSIS:
- currentPrice, sma50, sma200 with interpretation notes
- week52High and week52Low with distance notes
- avgVolume and shortInterest
- technicalAssessment must start with "Technical Assessment:" and provide an overall technical outlook (bullish/bearish/neutral with supporting evidence from RSI, moving averages, volume patterns)

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

// ── CONVENIENCE: combined prompt builder (legacy support) ────────────────────
export function buildPrompt(stockData, userInput) {
  return {
    systemPrompt: buildSystemPrompt(),
    userPrompt: buildUserPrompt(stockData, userInput),
  };
}
