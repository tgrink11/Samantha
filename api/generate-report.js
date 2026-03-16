// api/generate-report.js - Sends financial data to Claude for AI stock analysis
import { buildSystemPrompt, buildUserPrompt } from '../src/prompt.js';

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

function corsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(stockData, userInput);

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
