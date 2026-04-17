import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert code debugger and software engineer. When given code, you:

1. Identify ALL bugs, errors, and issues (syntax errors, logic bugs, runtime errors, security vulnerabilities, performance problems)
2. Explain each issue clearly in plain English - what it is, why it's a problem, where it occurs (file/line if possible)
3. Provide corrected code for each fix
4. Rate the overall code quality

Respond ONLY with a valid JSON object matching this exact schema:
{
  "summary": "Brief 1-2 sentence overview of the code and its issues",
  "quality_score": <number 1-10>,
  "issues": [
    {
      "id": <number>,
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "type": "syntax" | "logic" | "runtime" | "security" | "performance" | "style",
      "title": "Short title of the issue",
      "description": "Plain English explanation of the problem",
      "line_hint": "Line number or range if identifiable, or null",
      "fix": "Explanation of how to fix it",
      "fixed_code": "The corrected code snippet (just the relevant part)"
    }
  ],
  "full_fixed_code": "The complete corrected version of the entire code",
  "explanation": "Overall explanation of what the code does and key improvements made"
}

If the code has no bugs, still return valid JSON with an empty issues array and quality_score of 8-10.`;

app.post("/api/debug", async (req, res) => {
  const { code, language } = req.body;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Code is required" });
  }

  if (code.trim().length === 0) {
    return res.status(400).json({ error: "Code cannot be empty" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-7",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Debug the following ${language || "code"}:\n\n\`\`\`${language || ""}\n${code}\n\`\`\``,
        },
      ],
    });

    let fullText = "";

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullText += event.delta.text;
        res.write(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, full: fullText })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Claude API error:", err);
    res.write(
      `data: ${JSON.stringify({ error: err.message || "API error" })}\n\n`
    );
    res.end();
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
