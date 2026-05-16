// TDEE (Total Daily Energy Expenditure) calculator
// Uses Mifflin-St Jeor equation — the modern gold standard

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal         = "lose" | "maintain" | "gain";
export type Sex          = "male" | "female";
export type DeficitLevel = "mild" | "moderate" | "aggressive"; // -250 / -500 / -750
export type WorkStyle    = "desk" | "standing" | "physical";   // NEAT +0 / +300 / +600
export type MacroPreset  = "auto" | "bulk" | "cut" | "cardio"; // macro ratio override

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary:   "ללא פעילות",
  light:       "פעילות קלה (1-3 אימונים/שבוע)",
  moderate:    "פעילות בינונית (3-5 אימונים/שבוע)",
  active:      "פעילות גבוהה (6-7 אימונים/שבוע)",
  very_active: "פעילות אינטנסיבית (פעמיים ביום)",
};

export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose:     "ירידה במשקל",
  maintain: "שמירה על משקל",
  gain:     "עלייה / בניית שריר",
};

export const WORK_STYLE_LABELS: Record<WorkStyle, string> = {
  desk:     "ישיבתי 🖥️",
  standing: "עמידה / תנועה 🚶",
  physical: "עבודה פיזית 💪",
};

export const WORK_STYLE_NEAT: Record<WorkStyle, number> = {
  desk:     0,
  standing: 300,
  physical: 600,
};

export const MACRO_PRESET_LABELS: Record<MacroPreset, string> = {
  auto:   "אוטומטי",
  bulk:   "בולק 💪",
  cut:    "חיתוך 🔥",
  cardio: "קרדיו 🏃",
};

// Precise deficit/surplus by goal + level (kcal)
export const DEFICIT_DELTA: Record<Goal, Record<DeficitLevel, number>> = {
  lose:     { mild: -250, moderate: -500, aggressive: -750 },
  gain:     { mild:  200, moderate:  350, aggressive:  500 },
  maintain: { mild:    0, moderate:    0, aggressive:    0 },
};

export const DEFICIT_LABELS: Record<Goal, Record<DeficitLevel, string>> = {
  lose:     { mild: "עדין -250", moderate: "סטנדרטי -500", aggressive: "אגרסיבי -750" },
  gain:     { mild: "עדין +200", moderate: "סטנדרטי +350", aggressive: "אגרסיבי +500" },
  maintain: { mild: "",          moderate: "",              aggressive: ""              },
};

export interface TDEEInput {
  sex:           Sex;
  age:           number;
  heightCm:      number;
  weightKg:      number;
  activityLevel: ActivityLevel;
  goal:          Goal;
  // New optional inputs
  deficitLevel?:    DeficitLevel;
  workStyle?:       WorkStyle;
  averageSteps?:    number;
  targetWeightKg?:  number;
  targetDate?:      string;   // ISO date string
  macroPreset?:     MacroPreset;
  healthAdjustment?: number;  // kcal from AI analysis
}

export interface Scenario {
  label:      string;
  weeks:      number;
  targetDate: string;
  delta:      number;
}

export interface TDEEResult {
  bmr:             number;
  tdee:            number;
  targetCalories:  number;
  protein:         number;
  trainingProtein: number;
  carbs:           number;
  fat:             number;
  trainingCalories: number;
  waterMl:         number;
  // New result fields
  leanMassKg:   number;
  stepCalories: number;
  neatOffset:   number;
  deficitKcal:  number;
  bmi:          number;
  warnings:     string[];
  scenarios:    Scenario[];
}

export function calcAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

// Evidence-based protein multipliers (g/kg lean mass)
const PROTEIN_MULT: Record<ActivityLevel, { rest: number; training: number }> = {
  sedentary:   { rest: 1.4, training: 1.6 },
  light:       { rest: 1.6, training: 1.8 },
  moderate:    { rest: 1.8, training: 2.0 },
  active:      { rest: 2.0, training: 2.2 },
  very_active: { rest: 2.2, training: 2.4 },
};

const GOAL_PROTEIN_BONUS: Record<Goal, number> = {
  lose:     0.2,
  maintain: 0.0,
  gain:     0.2,
};

// Macro split ratios (protein from LBM takes priority; fat+carb fill remainder)
const MACRO_SPLITS: Record<MacroPreset, { c: number; f: number }> = {
  auto:   { c: 0.45, f: 0.25 },
  bulk:   { c: 0.45, f: 0.25 },
  cut:    { c: 0.30, f: 0.30 },
  cardio: { c: 0.55, f: 0.20 },
};

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
}

export function calcTDEE(input: TDEEInput): TDEEResult {
  const {
    sex, age, heightCm, weightKg, activityLevel, goal,
    deficitLevel    = "moderate",
    workStyle       = "desk",
    averageSteps    = 0,
    targetWeightKg,
    targetDate,
    macroPreset     = "auto",
    healthAdjustment = 0,
  } = input;

  // ── BMR (Mifflin-St Jeor) ──
  const bmr = sex === "male"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  // ── NEAT offsets ──
  const neatOffset   = WORK_STYLE_NEAT[workStyle];
  const stepCalories = Math.round(averageSteps * 0.04 * (weightKg / 70));

  // ── TDEE (maintenance) ──
  const tdee = bmr * ACTIVITY_MULTIPLIER[activityLevel] + stepCalories + neatOffset;

  // ── Deficit/surplus ──
  let deficitKcal = DEFICIT_DELTA[goal][deficitLevel];

  // Override deficit when both target weight and date are provided
  if (targetWeightKg !== undefined && targetDate) {
    const daysUntil = Math.max(
      1,
      Math.round((new Date(targetDate).getTime() - Date.now()) / 86_400_000)
    );
    const kgDelta     = weightKg - targetWeightKg;
    const requiredDelta = Math.round((kgDelta * 7700) / daysUntil);
    deficitKcal = Math.max(-750, Math.min(500, -requiredDelta));
  }

  const targetCalories  = Math.round(tdee + deficitKcal + healthAdjustment);
  const trainingCalories = targetCalories + 200;

  // ── Lean body mass (Boer formula) ──
  const leanMassKg = Math.max(
    1,
    sex === "male"
      ? 0.407 * weightKg + 0.267 * heightCm - 19.2
      : 0.252 * weightKg + 0.473 * heightCm - 48.3
  );

  // ── Protein (#4 lean mass, #8 age-adjusted) ──
  const protMult  = PROTEIN_MULT[activityLevel];
  const goalBonus = GOAL_PROTEIN_BONUS[goal];
  const ageFactor = age < 30 ? 1.0 : age < 50 ? 0.95 : 0.90;
  const protein         = Math.round(leanMassKg * (protMult.rest     + goalBonus) * ageFactor);
  const trainingProtein = Math.round(leanMassKg * (protMult.training + goalBonus) * ageFactor);

  // ── Fat & Carbs (macro preset) ──
  const split     = MACRO_SPLITS[macroPreset];
  const fat       = Math.round((targetCalories * split.f) / 9);
  const proteinKcal = protein * 4;
  const fatKcal     = fat * 9;
  const carbs     = Math.max(0, Math.round((targetCalories - proteinKcal - fatKcal) / 4));

  // ── Water ──
  const waterMl = Math.round(weightKg * 35);

  // ── BMI ──
  const bmi = Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10;

  // ── Safety warnings (#17) ──
  const warnings: string[] = [];
  if (sex === "female" && targetCalories < 1200)
    warnings.push("⚠️ פחות מ-1200 קל׳ לאישה — סיכון תזונתי");
  if (sex === "male" && targetCalories < 1500)
    warnings.push("⚠️ פחות מ-1500 קל׳ לגבר — סיכון תזונתי");
  if (deficitKcal < -750)
    warnings.push("⚠️ גרעון מעל 750 קל׳ — מומלץ פיקוח מקצועי");
  if (protein / leanMassKg < 1.2)
    warnings.push("⚠️ חלבון נמוך — פחות מ-1.2g/kg מסה רזה");
  if (bmi < 18.5)
    warnings.push("⚠️ BMI נמוך מ-18.5 — שוחח עם תזונאי");
  if (targetWeightKg !== undefined && targetDate) {
    const daysUntil = Math.round((new Date(targetDate).getTime() - Date.now()) / 86_400_000);
    const kgDelta   = Math.abs(weightKg - targetWeightKg);
    const requiredDelta = Math.abs((kgDelta * 7700) / daysUntil);
    if (requiredDelta > 750)
      warnings.push("⚠️ לוח הזמנים אגרסיבי מדי — שקול להאריך את תקופת היעד");
  }

  // ── 3-scenario predictor (#20) ──
  const today = new Date();
  const scenarios: Scenario[] = [];
  if (targetWeightKg !== undefined) {
    const kgDelta = Math.abs(weightKg - targetWeightKg);
    for (const s of [
      { label: "שמרני",    delta: 250 },
      { label: "סטנדרטי", delta: 500 },
      { label: "אגרסיבי", delta: 750 },
    ]) {
      const days = Math.ceil((kgDelta * 7700) / (s.delta * 7) * 7);
      scenarios.push({ label: s.label, weeks: Math.ceil(days / 7), targetDate: addDays(today, days), delta: s.delta });
    }
  }

  return {
    bmr:              Math.round(bmr),
    tdee:             Math.round(tdee),
    targetCalories,
    trainingCalories,
    protein,
    trainingProtein,
    carbs,
    fat,
    waterMl,
    leanMassKg:   Math.round(leanMassKg * 10) / 10,
    stepCalories,
    neatOffset,
    deficitKcal,
    bmi,
    warnings,
    scenarios,
  };
}
