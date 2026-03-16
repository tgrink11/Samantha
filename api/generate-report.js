// api/generate-report.js - Sends financial data to Claude for AI stock analysis
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

function corsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const REPORT_SCHEMA = JSON.stringify({
  company: {
    name: "string - full legal company name",
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
    marketCapLabel: "string - formatted market cap, e.g. $3.2T, $450B, $12.5B",
    week52Range: "string - e.g. $150.00 - $225.00",
    week52RangeNote: "string - context about where price sits in range",
    recommendation: "string - one of: Strong Buy, Buy, Hold, Sell, Strong Sell",
    recommendationDetail: "string - 1-2 sentence justification"
  },
  executiveSummary: {
    takeaways: [
      { number: "number - 1-3", title: "string - short headline", body: "string - 2-3 sentence explanation" }
    ]
  },
  quantitative: {
    healthGrades: {
      profitability: { grade: "string - A+ to F", detail: "string - rationale with key metrics" },
      liquidity: { grade: "string - A+ to F", detail: "string - rationale with key metrics" },
      solvency: { grade: "string - A+ to F", detail: "string - rationale with key metrics" },
      efficiency: { grade: "string - A+ to F", detail: "string - rationale with key metrics" }
    },
    ownership: {
      institutions: "string - percentage, e.g. 72.5%",
      public: "string - percentage, e.g. 25.8%",
      insiders: "string - percentage, e.g. 1.7%",
      commentary: "string - insight on ownership structure"
    },
    shortInterest: {
      sharesShort: "string - formatted number, e.g. 12.5M",
      shortPercentFloat: "string - percentage, e.g. 1.2%",
      shortRatio: "string - days to cover, e.g. 1.8 days",
      priorMonth: "string - prior month comparison, e.g. 29.1M",
      commentary: "string - what short interest signals"
    },
    balanceSheet: {
      items: [
        { label: "string - e.g. Total Cash", value: "string - formatted, e.g. $65.2B", detail: "string - trend context" }
      ],
      commentary: "string - overall balance sheet assessment"
    }
  },
  keyRatios: {
    rows: [
      { metric: "string - ratio name", current: "string - current value", prior1: "string - prior year value", prior2: "string - 2 years ago value", industryAvg: "string - industry average" }
    ],
    commentary: "string - key ratio insights, prefix with Valuation Context:"
  },
  growth: {
    ruleOf40Score: "string - Kerry Rule of 40 score (3-Year Rev CAGR + 3-Year EPS CAGR), e.g. 52.3",
    ruleOf40Max: "string - always 40",
    ruleOf40Commentary: "string - interpretation of Rule of 40",
    metrics: [
      { label: "string - e.g. Revenue Growth YoY", value: "string - formatted percentage or number" }
    ],
    commentary: "string - growth trajectory analysis, prefix with Growth Analysis:"
  },
  marketTAM: {
    title: "string - market opportunity title",
    totalTAM: "string - formatted, e.g. $500B by 2030",
    segments: [
      { name: "string - segment name", size: "string - segment TAM size", description: "string - company position in segment" }
    ],
    commentary: "string - TAM analysis, prefix with Market Position:"
  },
  peerComparison: {
    rows: [
      { company: "string - company name (ticker)", marketCap: "string - formatted", revenueGrowth: "string - percentage", grossMargin: "string - percentage", priceSales: "string - ratio", scale: "string - e.g. Mega-cap leader, Mid-cap challenger" }
    ],
    commentary: "string - competitive positioning analysis, prefix with Competitive Edge:"
  },
  forecasts: {
    conservative: { assumptions: "string", jan2027: "string - e.g. $185", jan2028: "string", jan2029: "string", threeYearROI: "string - e.g. +45%", meetsGoal: "boolean" },
    moderate: { assumptions: "string", jan2027: "string", jan2028: "string", jan2029: "string", threeYearROI: "string", meetsGoal: "boolean" },
    aggressive: { assumptions: "string", jan2027: "string", jan2028: "string", jan2029: "string", threeYearROI: "string", meetsGoal: "boolean" },
    commentary: "string - forecast analysis, prefix with 100% ROI Goal Check:"
  },
  riskDashboard: {
    volatility12m: "string - annualized 12-month volatility, e.g. 32.5%",
    volatilityLabel: "string - Low (<20%), Moderate (20-35%), High (35-50%), or Extreme (>50%)",
    volatilityDetail: "string - context on what drives the volatility",
    beta: "string - beta relative to S&P 500, e.g. 1.25",
    betaDetail: "string - interpretation of beta value",
    maxDrawdown1y: "string - largest peak-to-trough decline in last 12 months, e.g. -28.5%",
    maxDrawdownDetail: "string - when it happened and what caused it",
    sharpeRatio: "string - risk-adjusted return",
    sortinoRatio: "string - downside risk-adjusted return",
    riskReturnInterpretation: "string - 1-2 sentences on overall risk/return profile",
    riskFactors: [
      { name: "string", severity: "string - High/Medium/Low", detail: "string" }
    ],
    technical: {
      currentPrice: "string - current price formatted",
      sma50: "string - 50-day SMA value",
      sma50Note: "string - price vs SMA50 interpretation",
      sma200: "string - 200-day SMA value",
      sma200Note: "string - price vs SMA200 interpretation",
      week52High: "string - 52-week high price",
      week52HighNote: "string - distance from 52-week high",
      week52Low: "string - 52-week low price",
      week52LowNote: "string - distance from 52-week low",
      avgVolume: "string - average daily volume",
      shortInterest: "string - short interest summary"
    },
    technicalAssessment: "string - overall technical analysis, prefix with Technical Assessment:"
  },
  qualitative: {
    businessModel: "string - 2-3 sentences on business model strength",
    managementQuality: "string - 2-3 sentences on leadership",
    competitiveMoat: "string - 2-3 sentences on competitive advantages",
    regulatoryGeopolitical: "string - 2-3 sentences on regulatory/geopolitical risks",
    rubricScore: { score: "number - 1 to 10", max: 10, commentary: "string - justification for qualitative score" }
  },
  callToAction: {
    recommendation: "string - full paragraph recommendation with **bold** markers for key phrases",
    stopLoss: "string - suggested stop-loss level with reasoning",
    currentHolderGuidance: "string - advice for current holders",
    watchPoints: ["string - key events or levels to watch (4-6 items)"]
  },
  investmentScore: {
    score: "number - overall investment attractiveness score 1-100 (80-100: Strong Buy, 60-79: Buy, 40-59: Hold, 20-39: Underperform, 1-19: Sell)",
    interpretation: "string - 1-2 sentences explaining the score"
  },
  podcastScript: "string - 800-1200 word podcast script as Samantha speaking conversationally to the user by name. No markdown or formatting."
}, null, 2);

function buildMasterPrompt(stockData, userInput) {
  const { ticker, price, shares, portfolioPct, userName, analysisDate } = userInput;

  return [
    "You are Samantha, the AI Stock Analyst for Best of Us Investors. Analyze the following stock using the comprehensive financial data provided below. Return your analysis as a single JSON object matching the EXACT schema provided. Every field must be populated - do not leave any field null or empty.",
    "",
    "## User Context",
    "- Analyst: " + (userName || "Investor"),
    "- Ticker: " + ticker,
    "- Current Entry Price: $" + (price || "N/A"),
    "- Shares Held: " + (shares || 0),
    "- Portfolio Allocation: " + (portfolioPct || 0) + "%",
    "- Analysis Date: " + (analysisDate || new Date().toISOString().split("T")[0]),
    "",
    "## Required JSON Schema",
    REPORT_SCHEMA,
    "",
    "## Financial Data",
    JSON.stringify(stockData, null, 2),
    "",
    "## Instructions",
    "1. Analyze ALL the financial data thoroughly - income statements, balance sheet, cash flow, ratios, technicals, macro environment, peer comparisons, ownership, and insider activity.",
    "2. Calculate the Rule of 40 score (revenue growth % + operating margin %).",
    "3. For forecasts, use the analyst estimates and historical growth rates to project three scenarios (conservative, moderate, aggressive). Price targets should be for Jan 2027, Jan 2028, and Jan 2029. The goal is 100% ROI in 3 years - indicate whether each scenario meets that goal.",
    "4. Grade the company financial health (profitability, liquidity, solvency, efficiency) on an A+ to F scale.",
    "5. Identify 3-6 key risk factors with severity ratings.",
    "6. Compare against the provided peer data.",
    "7. For the podcast script, write as Samantha speaking directly to the listener in a warm, knowledgeable, conversational tone. Cover the key points of the analysis in 3-5 minutes of speaking time (approximately 500-750 words).",
    "8. The recommendation must be one of: Strong Buy, Buy, Hold, Sell, Strong Sell.",
    "9. Return ONLY the JSON object. No markdown, no explanation, no text before or after the JSON."
  ].join("\n");
}

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

  const { stockData, userInput } = body || {};
  if (!stockData) return res.status(400).json({ error: "Missing stockData in request body" });
  if (!userInput || !userInput.ticker) return res.status(400).json({ error: "Missing userInput.ticker in request body" });

  const masterPrompt = buildMasterPrompt(stockData, userInput);

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
        max_tokens: 16000,
        system: "You are Samantha, an expert AI stock analyst. You MUST return ONLY valid JSON matching the exact schema requested. Do not include any markdown formatting, code fences, or explanatory text. Output raw JSON only.",
        messages: [
          { role: "user", content: masterPrompt },
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
      console.error("Failed to parse Claude response as JSON:", parseErr.message);
      return res.status(502).json({
        error: "Failed to parse AI response as JSON",
        rawPreview: rawText.slice(0, 500),
      });
    }

    return res.status(200).json(report);
  } catch (err) {
    console.error("generate-report error:", err);
    return res.status(500).json({ error: "Report generation failed", detail: err.message });
  }
}
