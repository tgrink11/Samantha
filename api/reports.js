// api/reports.js - Lists all saved stock reports from Supabase
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

  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl) return res.status(500).json({ error: "SUPABASE_URL not configured" });
  if (!supabaseKey) return res.status(500).json({ error: "SUPABASE_KEY not configured" });

  try {
    const queryParams = new URLSearchParams({
      select: "ticker,company_name,analysis_date,input_price,created_at",
      order: "created_at.desc",
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
      console.error("Supabase list error:", response.status, errBody);
      return res.status(502).json({
        error: "Failed to fetch reports from Supabase",
        status: response.status,
        detail: errBody,
      });
    }

    const reports = await response.json();

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.status(200).json(reports);
  } catch (err) {
    console.error("reports error:", err);
    return res.status(500).json({ error: "Failed to list reports", detail: err.message });
  }
}
