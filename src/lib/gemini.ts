const API_KEY  = import.meta.env.VITE_GEMINI_API_KEY as string;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Upgraded to gemini-2.0-flash for better speed + accuracy on both vision and text
const VISION_MODEL = "gemini-2.0-flash";
const TEXT_MODEL   = "gemini-2.0-flash";

// ─── Vision (image + text prompt) ────────────────────────────────────────────

export async function analyzeImage(
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  if (!API_KEY) throw new Error("VITE_GEMINI_API_KEY is not set");
  const response = await fetch(
    `${BASE_URL}/models/${VISION_MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Image } },
            { text: prompt }
          ]
        }],
        generationConfig: { temperature: 0.1, topP: 0.9 },
      })
    }
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Vision error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Text-only generation ─────────────────────────────────────────────────────

export async function generateText(prompt: string): Promise<string> {
  if (!API_KEY) throw new Error("VITE_GEMINI_API_KEY is not set");
  const response = await fetch(
    `${BASE_URL}/models/${TEXT_MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, topP: 0.95 },
      })
    }
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Text error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── JSON parse helper (strips markdown fences Gemini sometimes adds) ─────────

export function parseGeminiJson<T>(raw: string): T {
  const clean = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/,  "")
    .trim();
  return JSON.parse(clean) as T;
}
