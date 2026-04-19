const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export async function analyzeImage(base64Image: string, mimeType: string, prompt: string): Promise<string> {
  const response = await fetch(
    `${BASE_URL}/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Image } },
            { text: prompt }
          ]
        }]
      })
    }
  );
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function generateText(prompt: string): Promise<string> {
  const response = await fetch(
    `${BASE_URL}/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
