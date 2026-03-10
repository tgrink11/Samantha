// api/report.js - Fetches a single stock report by ticker from Supabase
function corsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const ticker = (req.query.ticker || "").trim().toUpperCase();
  if (!ticker) return res.status(400).json({ error: "Missing required query param: ticker" });

  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl) return res.status(500).json({ error: "SUPABASE_URL not configured" });
  if (!supabaseKey) return res.status(500).json({ error: "SUPABASE_KEY not configured" });

  try {
    const queryParams = new URLSearchParams({
      ticker: "eq." + ticker,
      order: "analysis_date.desc",
      limit: "1",
    });

    const response = await fetch(
      supabaseUrl + "/rest/v1/stock_reports?" + queryParams.toString(),
      {
        method: "GET",
        headers: {
          "apikey": supabaseKey,
          "Authorization": "Bearer " + supabaseKey,
        },
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Supabase fetch error:", response.status, errBody);
      return res.status(502).json({
        error: "Failed to fetch report from Supabase",
        status: response.status,
        detail: errBody,
      });
    }

    const reports = await response.json();

    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: "No report found for ticker: " + ticker });
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json(reports[0]);
  } catch (err) {
    console.error("report error:", err);
    return res.status(500).json({ error: "Failed to fetch report", detail: err.message });
  }
}
