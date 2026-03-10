// api/generate-podcast.js - Converts podcast script text to audio via OpenAI TTS
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

function corsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  corsHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_KEY not configured" });

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { text, ticker } = body || {};
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Missing or empty 'text' field in request body" });
  }

  try {
    const response = await fetch(OPENAI_TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "nova",
        input: text,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("OpenAI TTS error:", response.status, errBody);
      return res.status(502).json({
        error: "OpenAI TTS request failed",
        status: response.status,
        detail: errBody,
      });
    }

    // Convert audio response to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    return res.status(200).json({
      audio: base64Audio,
      format: "mp3",
      ticker: ticker || "unknown",
      characterCount: text.length,
    });
  } catch (err) {
    console.error("generate-podcast error:", err);
    return res.status(500).json({ error: "Podcast generation failed", detail: err.message });
  }
}
