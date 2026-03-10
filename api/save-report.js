// api/save-report.js - Saves stock analysis report to Supabase
function corsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return { url, key };
}

export default async function handler(req, res) {
  corsHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl) return res.status(500).json({ error: "SUPABASE_URL not configured" });
  if (!supabaseKey) return res.status(500).json({ error: "SUPABASE_KEY not configured" });

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const {
    ticker,
    companyName,
    analysisDate,
    userName,
    inputPrice,
    inputShares,
    inputPortfolioPct,
    reportJson,
    podcastUrl,
  } = body || {};

  if (!ticker) return res.status(400).json({ error: "Missing required field: ticker" });
  if (!reportJson) return res.status(400).json({ error: "Missing required field: reportJson" });

  const record = {
    ticker: ticker.toUpperCase(),
    company_name: companyName || null,
    analysis_date: analysisDate || new Date().toISOString().split("T")[0],
    user_name: userName || null,
    input_price: inputPrice != null ? Number(inputPrice) : null,
    input_shares: inputShares != null ? Number(inputShares) : null,
    input_portfolio_pct: inputPortfolioPct != null ? Number(inputPortfolioPct) : null,
    report_json: typeof reportJson === "string" ? JSON.parse(reportJson) : reportJson,
    podcast_url: podcastUrl || null,
  };

  try {
    const response = await fetch(supabaseUrl + "/rest/v1/stock_reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": "Bearer " + supabaseKey,
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Supabase save error:", response.status, errBody);
      return res.status(502).json({
        error: "Failed to save report to Supabase",
        status: response.status,
        detail: errBody,
      });
    }

    return res.status(200).json({
      success: true,
      ticker: record.ticker,
      analysisDate: record.analysis_date,
    });
  } catch (err) {
    console.error("save-report error:", err);
    return res.status(500).json({ error: "Failed to save report", detail: err.message });
  }
}
