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

// ─── Receipt Scanning ─────────────────────────────────────────────────────────

export interface ScannedExpense {
  name: string;
  amount: number;
  category: string;
}

export async function scanReceipt(imageBase64: string, mimeType?: string): Promise<ScannedExpense[]> {
  const { data, error } = await supabase.functions.invoke("receipt-scan", {
    body: { imageBase64, mimeType },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return (data?.items ?? []) as ScannedExpense[];
}

// ─── Finance Insights ─────────────────────────────────────────────────────────

export interface FinanceInsights {
  status: "excellent" | "good" | "warning" | "danger";
  summary: string;
  comparisons: { category: string; change_pct: number; verdict: "good" | "neutral" | "bad"; note: string }[];
  recommendations: { title: string; impact_ils: number; action: string }[];
}

export async function getFinanceInsights(payload: {
  currentMonth: { income: number; expenses: number; savings: number; categories: Record<string, number> };
  previousMonths: { label: string; income: number; expenses: number; savings: number }[];
  savingsGoalPct: number;
}): Promise<FinanceInsights> {
  const { data, error } = await supabase.functions.invoke("finance-insights-ai", { body: payload });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.insights) throw new Error("לא התקבל ניתוח");
  return data.insights as FinanceInsights;
}

// ─── Workout Plan ─────────────────────────────────────────────────────────────

export interface WorkoutPlan {
  summary: string;
  workouts: {
    day: string;
    name: string;
    category: string;
    duration_minutes: number;
    exercises: { name: string; sets: number; reps: string; weight_kg?: number; notes?: string }[];
  }[];
  tips: string[];
}

export async function generateWorkoutPlan(payload: {
  goal: string;
  daysPerWeek: number;
  equipment: string;
  constraints: string;
  recentPRs: { exercise_name: string; value: number; unit: string }[];
}): Promise<WorkoutPlan> {
  const { data, error } = await supabase.functions.invoke("workout-plan-ai", { body: payload });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.plan) throw new Error("לא התקבלה תוכנית");
  return data.plan as WorkoutPlan;
}

// ─── Coach Feedback ───────────────────────────────────────────────────────────

export async function generateCoachFeedback(payload: {
  mins: number;
  calories: number;
  name: string;
  muscles?: string;
}): Promise<string> {
  const { mins, calories, name, muscles } = payload;
  const prompt = `אתה מאמן כושר אישי. המשתמש סיים אימון "${name}" — ${mins} דקות, ${calories} קלוריות.${muscles ? ` שרירים עיקריים: ${muscles}.` : ""} כתוב משפט עידוד קצר אחד בעברית (עד 20 מילה), תוך שיבוח הביצוע ועצה קצרה ממוקדת לאחר האימון (תזונה, מנוחה, או תרגיל המשך). השב במשפט אחד בלבד.`;
  return invokeAI({ prompt });
}

// ─── Generic (for free-form text components) ─────────────────────────────────

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

// JSON parse helper — strips markdown fences from OpenAI responses, extracts first JSON object/array
export function parseAIJson<T>(raw: string): T {
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
