const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const BASE_URL = "https://api.openai.com/v1";

// ─── Vision (image + text prompt) ────────────────────────────────────────────

export async function analyzeImage(
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  if (!API_KEY) throw new Error("VITE_OPENAI_API_KEY is not set");
  const dataUrl = base64Image.startsWith("data:")
    ? base64Image
    : `data:${mimeType};base64,${base64Image}`;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl } },
            { type: "text", text: prompt },
          ],
        },
      ],
      temperature: 0.1,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI Vision error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Text-only generation ─────────────────────────────────────────────────────

export async function generateText(prompt: string): Promise<string> {
  if (!API_KEY) throw new Error("VITE_OPENAI_API_KEY is not set");
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI Text error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── JSON parse helper (robust: handles fences, preamble text, arrays) ───────

export function parseGeminiJson<T>(raw: string): T {
  let clean = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const objStart  = clean.indexOf("{");
  const arrStart  = clean.indexOf("[");
  const jsonStart =
    objStart === -1 ? arrStart
    : arrStart === -1 ? objStart
    : Math.min(objStart, arrStart);

  if (jsonStart > 0) clean = clean.slice(jsonStart);

  const lastBrace   = clean.lastIndexOf("}");
  const lastBracket = clean.lastIndexOf("]");
  const jsonEnd     = Math.max(lastBrace, lastBracket);
  if (jsonEnd !== -1 && jsonEnd < clean.length - 1) {
    clean = clean.slice(0, jsonEnd + 1);
  }

  return JSON.parse(clean) as T;
}
