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

// ── New Types ──────────────────────────────────────────────────────────────

export interface AiExercise {
  name: string;
  sets: number;
  reps: string;
  weight_kg?: number;
  notes?: string;
  explanation?: string;   // short Hebrew sentence why this exercise was chosen
}

export interface AiDayWorkout {
  day: string;
  name: string;
  category: string;
  duration_minutes: number;
  exercises: AiExercise[];
}

export interface AiWeek {
  week_number: number;
  overload_note: string;
  workouts: AiDayWorkout[];
}

export interface WorkoutPlan {
  summary: string;
  split_type?: string;              // "PPL" | "Upper/Lower" | "Full Body"
  weeks: AiWeek[];                  // 4 weeks
  deload_week?: AiWeek;             // week 5
  tips: string[];
  // Legacy compat (old plans only had workouts array):
  workouts?: AiDayWorkout[];
}

export interface GeneratePlanPayload {
  // Existing params:
  goal: string;
  daysPerWeek: number;
  equipment: string;
  constraints: string;
  recentPRs?: { exercise_name: string; value: number; unit: string }[];
  exerciseList?: { name: string; muscles: string; equipment: string }[];
  // New params:
  age?: number;
  gender?: "male" | "female" | "other";
  fitnessLevel?: "beginner" | "intermediate" | "advanced";
  sessionMinutes?: number;
  intensity?: 1 | 2 | 3 | 4 | 5;
  restDays?: number[];
  preferredMuscles?: string[];
  avoidedMuscles?: string[];
  favoriteExercises?: string[];
  blacklistedExercises?: string[];
  recentWorkouts?: { name: string; date: string; exercises: string[] }[];
}

export async function generateWorkoutPlan(payload: GeneratePlanPayload): Promise<WorkoutPlan> {
  const { data, error } = await supabase.functions.invoke("workout-plan-ai", { body: payload });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.plan) throw new Error("לא התקבלה תוכנית");
  return data.plan as WorkoutPlan;
}

// Helper: get all exercises from week 1 (for backward compat display)
export function getPlanWeek1Workouts(plan: WorkoutPlan): AiDayWorkout[] {
  if (plan.weeks && plan.weeks.length > 0) {
    return plan.weeks[0].workouts;
  }
  return plan.workouts ?? [];
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
