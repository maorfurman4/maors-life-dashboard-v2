import { supabase } from "@/integrations/supabase/client";

export interface MealRecognitionResult {
  name: string;
  items: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: "low" | "medium" | "high";
}

async function invokeAI(payload: {
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-proxy", { body: payload });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data?.text ?? "";
}

export async function recognizeMeal(imageBase64: string): Promise<MealRecognitionResult> {
  const { data, error } = await supabase.functions.invoke("meal-recognize", {
    body: { imageBase64 },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.meal) throw new Error("לא הצלחתי לזהות ארוחה בתמונה");
  return data.meal as MealRecognitionResult;
}

export async function analyzeImage(
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  return invokeAI({ prompt, imageBase64: base64Image, mimeType });
}

export async function generateText(prompt: string): Promise<string> {
  return invokeAI({ prompt });
}

// JSON parse helper — strips markdown fences and extracts first JSON object/array
export function parseGeminiJson<T>(raw: string): T {
  let clean = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/g, "")
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
  if (jsonEnd !== -1 && jsonEnd < clean.length - 1) clean = clean.slice(0, jsonEnd + 1);

  return JSON.parse(clean) as T;
}
