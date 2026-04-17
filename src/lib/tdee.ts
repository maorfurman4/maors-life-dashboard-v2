// TDEE (Total Daily Energy Expenditure) calculator
// Uses Mifflin-St Jeor equation — the modern gold standard

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";
export type Sex = "male" | "female";

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "ללא פעילות",
  light: "פעילות קלה (1-3 אימונים/שבוע)",
  moderate: "פעילות בינונית (3-5 אימונים/שבוע)",
  active: "פעילות גבוהה (6-7 אימונים/שבוע)",
  very_active: "פעילות אינטנסיבית (פעמיים ביום)",
};

export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "ירידה במשקל",
  maintain: "שמירה על משקל",
  gain: "עלייה במשקל / מסת שריר",
};

export const GOAL_ADJUSTMENT: Record<Goal, number> = {
  lose: -500,    // ~0.5kg/week deficit
  maintain: 0,
  gain: 300,     // lean bulk surplus
};

export interface TDEEInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface TDEEResult {
  bmr: number;           // Basal Metabolic Rate
  tdee: number;          // Maintenance calories
  targetCalories: number;
  protein: number;       // grams (rest day)
  trainingProtein: number;
  carbs: number;
  fat: number;
  trainingCalories: number; // training day = +200 kcal
  waterMl: number;
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

export function calcTDEE(input: TDEEInput): TDEEResult {
  const { sex, age, heightCm, weightKg, activityLevel, goal } = input;

  // Mifflin-St Jeor BMR
  const bmr = sex === "male"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * ACTIVITY_MULTIPLIER[activityLevel];
  const targetCalories = tdee + GOAL_ADJUSTMENT[goal];
  const trainingCalories = targetCalories + 200;

  // Macros: protein 2g/kg (training), 1.6g/kg (rest); fat 25% kcal; carbs = remainder
  const protein = Math.round(weightKg * 1.6);
  const trainingProtein = Math.round(weightKg * 2.0);
  const fat = Math.round((targetCalories * 0.25) / 9);
  const proteinKcal = protein * 4;
  const fatKcal = fat * 9;
  const carbs = Math.max(0, Math.round((targetCalories - proteinKcal - fatKcal) / 4));

  // Water: 35ml per kg body weight
  const waterMl = Math.round(weightKg * 35);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    trainingCalories: Math.round(trainingCalories),
    protein,
    trainingProtein,
    carbs,
    fat,
    waterMl,
  };
}
