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
    marketCap: "string - formatted, e.g. $3.45T",
    marketCapLabel: "string - e.g. Mega Cap",
    week52Range: "string - e.g. $150.00 - $225.00",
    week52RangeNote: "string - context about where price sits in range",
    recommendation: "string - one of: Strong Buy, Buy, Hold, Sell, Strong Sell",
    recommendationDetail: "string - 1-2 sentence justification"
  },
  executiveSummary: {
    takeaways: [
      { number: "number - 1-5", title: "string - short headline", body: "string - 2-3 sentence explanation" }
    ]
  },
  quantitative: {
    healthGrades: {
      profitability: { grade: "string - A+ to F", detail: "string" },
      liquidity: { grade: "string - A+ to F", detail: "string" },
      solvency: { grade: "string - A+ to F", detail: "string" },
      efficiency: { grade: "string - A+ to F", detail: "string" }
    },
    ownership: {
      institutions: "string - percentage, e.g. 72.5%",
      public: "string - percentage",
      insiders: "string - percentage",
      commentary: "string - insight on ownership structure"
    },
    shortInterest: {
      sharesShort: "string - formatted number, e.g. 12.5M",
      shortPercentFloat: "string - percentage",
      shortRatio: "string - days to cover",
      priorMonth: "string - prior month comparison",
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
      { metric: "string - ratio name", current: "string - current value", prior1: "string - prior quarter or year", prior2: "string - 2 periods ago", industryAvg: "string - industry average or N/A" }
    ],
    commentary: "string - key ratio insights"
  },
  growth: {
    ruleOf40Score: "number - revenue growth pct + profit margin pct",
    ruleOf40Max: 40,
    ruleOf40Commentary: "string - interpretation of Rule of 40",
    metrics: [
      { label: "string - e.g. Revenue Growth YoY", value: "string - formatted percentage or number" }
    ],
    commentary: "string - growth trajectory analysis"
  },
  marketTAM: {
    title: "string - e.g. Total Addressable Market",
    totalTAM: "string - formatted, e.g. $500B",
    segments: [
      { name: "string", size: "string - formatted", description: "string" }
    ],
    commentary: "string - TAM analysis and company positioning"
  },
  peerComparison: {
    rows: [
      { company: "string - company name (ticker)", marketCap: "string - formatted", revenueGrowth: "string - percentage", grossMargin: "string - percentage", priceSales: "string - ratio", scale: "string - e.g. Mega Cap, Large Cap" }
    ],
    commentary: "string - competitive positioning analysis"
  },
  forecasts: {
    conservative: { assumptions: "string", jan2027: "string", jan2028: "string", jan2029: "string", threeYearROI: "string", meetsGoal: "boolean" },
    moderate: { assumptions: "string", jan2027: "string", jan2028: "string", jan2029: "string", threeYearROI: "string", meetsGoal: "boolean" },
    aggressive: { assumptions: "string", jan2027: "string", jan2028: "string", jan2029: "string", threeYearROI: "string", meetsGoal: "boolean" },
    commentary: "string - forecast methodology and key drivers"
  },
  riskDashboard: {
    volatility12m: "string", beta: "string", maxDrawdown1y: "string", sharpeRatio: "string", sortinoRatio: "string",
    riskFactors: [
      { name: "string", severity: "string - High/Medium/Low", detail: "string" }
    ],
    technical: {
      currentPrice: "string", sma50: "string", sma200: "string", week52High: "string", week52Low: "string", avgVolume: "string", shortInterest: "string"
    },
    technicalAssessment: "string - overall technical analysis summary"
  },
  qualitative: {
    businessModel: "string - 2-3 sentences on business model strength",
    managementQuality: "string - 2-3 sentences on leadership",
    competitiveMoat: "string - 2-3 sentences on competitive advantages",
    regulatoryGeopolitical: "string - 2-3 sentences on regulatory/geopolitical risks",
    rubricScore: { score: "number - 1 to 10", max: 10, commentary: "string - justification for qualitative score" }
  },
  callToAction: {
    recommendation: "string - clear actionable recommendation",
    stopLoss: "string - suggested stop-loss level with reasoning",
    currentHolderGuidance: "string - advice for current holders",
    watchPoints: ["string - key events or levels to watch"]
  },
  podcastScript: "string - 3-5 minute podcast script. Conversational insightful tone as Samantha."
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
        model: "claude-sonnet-4-6-20250514",
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
    const codeBlockRegex = new RegExp(tick + tick + tick + "(?:json)?\s*\n?([\s\S]*?)\n?\s*" + tick + tick + tick);
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
