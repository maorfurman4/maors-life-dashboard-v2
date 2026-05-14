/**
 * calorieCalculator.ts — Local Math Engine
 * Calculates calorie burn without any AI/API calls.
 *
 * Cardio:   Mifflin-St Jeor–adjusted MET formula
 *           Calories = MET × weight_kg × (minutes / 60)
 *
 * Strength: Hybrid model — MET-based metabolic cost + volume-load contribution
 *           Refs: Compendium of Physical Activities (Ainsworth et al., 2011)
 */

// ─── Intensity levels ────────────────────────────────────────────────────────

export type Intensity = "low" | "medium" | "high";

export const INTENSITY_LABELS: Record<Intensity, string> = {
  low:    "קל",
  medium: "בינוני",
  high:   "אינטנסיבי",
};

// ─── Cardio sports ────────────────────────────────────────────────────────────

export interface CardioSport {
  key: string;
  labelHe: string;
  emoji: string;
  color: string;
  /** MET values per intensity level (Compendium of Physical Activities) */
  met: Record<Intensity, number>;
  /** DB workout category for logging */
  dbCategory: "running" | "mixed";
}

export const CARDIO_SPORTS: CardioSport[] = [
  {
    key: "running",
    labelHe: "ריצה",
    emoji: "🏃",
    color: "#f97316",
    met: { low: 7.0, medium: 9.5, high: 12.0 },
    dbCategory: "running",
  },
  {
    key: "cycling",
    labelHe: "אופניים",
    emoji: "🚴",
    color: "#3b82f6",
    met: { low: 6.0, medium: 8.0, high: 10.0 },
    dbCategory: "mixed",
  },
  {
    key: "swimming",
    labelHe: "שחייה",
    emoji: "🏊",
    color: "#06b6d4",
    met: { low: 5.5, medium: 7.5, high: 9.8 },
    dbCategory: "mixed",
  },
  {
    key: "soccer",
    labelHe: "כדורגל",
    emoji: "⚽",
    color: "#10b981",
    met: { low: 7.0, medium: 8.5, high: 10.0 },
    dbCategory: "mixed",
  },
  {
    key: "basketball",
    labelHe: "כדורסל",
    emoji: "🏀",
    color: "#f97316",
    met: { low: 6.0, medium: 7.5, high: 9.0 },
    dbCategory: "mixed",
  },
  {
    key: "volleyball",
    labelHe: "כדורעף",
    emoji: "🏐",
    color: "#8b5cf6",
    met: { low: 4.0, medium: 5.5, high: 7.5 },
    dbCategory: "mixed",
  },
  {
    key: "hiit",
    labelHe: "HIIT",
    emoji: "⚡",
    color: "#ef4444",
    met: { low: 8.0, medium: 10.0, high: 12.5 },
    dbCategory: "mixed",
  },
  {
    key: "jump_rope",
    labelHe: "חבל קפיצה",
    emoji: "🪢",
    color: "#eab308",
    met: { low: 8.0, medium: 10.0, high: 12.0 },
    dbCategory: "mixed",
  },
  {
    key: "rowing",
    labelHe: "חתירה",
    emoji: "🚣",
    color: "#6366f1",
    met: { low: 7.0, medium: 8.5, high: 11.0 },
    dbCategory: "mixed",
  },
  {
    key: "hiking",
    labelHe: "טיול הרים",
    emoji: "🥾",
    color: "#84cc16",
    met: { low: 5.0, medium: 6.5, high: 8.0 },
    dbCategory: "mixed",
  },
  {
    key: "tennis",
    labelHe: "טניס",
    emoji: "🎾",
    color: "#f59e0b",
    met: { low: 6.0, medium: 7.5, high: 9.0 },
    dbCategory: "mixed",
  },
  {
    key: "martial_arts",
    labelHe: "אומנויות לחימה",
    emoji: "🥊",
    color: "#ec4899",
    met: { low: 6.0, medium: 8.0, high: 10.5 },
    dbCategory: "mixed",
  },
];

// ─── Cardio calorie formula ───────────────────────────────────────────────────

/**
 * Cardio calorie estimate.
 * Formula: Calories = MET × weight_kg × (minutes / 60)
 *
 * @param sportKey   - key from CARDIO_SPORTS
 * @param intensity  - "low" | "medium" | "high"
 * @param minutes    - duration in minutes
 * @param weightKg   - user body weight in kg (default 75)
 */
export function calcCardioCalories(
  sportKey: string,
  intensity: Intensity,
  minutes: number,
  weightKg = 75
): number {
  if (minutes <= 0 || weightKg <= 0) return 0;
  const sport = CARDIO_SPORTS.find((s) => s.key === sportKey);
  const met = sport?.met[intensity] ?? 8.0;
  return Math.round(met * weightKg * (minutes / 60));
}

// ─── Strength calorie formula ─────────────────────────────────────────────────

/** MET values for strength training by intensity */
const MET_STRENGTH: Record<Intensity, number> = {
  low:    3.5,   // light/circuit
  medium: 5.0,   // moderate free-weight
  high:   6.5,   // vigorous powerlifting
};

/**
 * Strength calorie estimate.
 * Hybrid model: MET-based metabolic cost + volume-load contribution.
 *
 * @param totalSets   - total sets performed across all exercises
 * @param avgReps     - average reps per set
 * @param avgWeightKg - average weight lifted per rep (kg); 0 for bodyweight
 * @param intensity   - "low" | "medium" | "high"
 * @param bodyWeightKg - user body weight in kg (default 75)
 */
export function calcStrengthCalories(
  totalSets: number,
  avgReps: number,
  avgWeightKg: number,
  intensity: Intensity,
  bodyWeightKg = 75
): number {
  if (totalSets <= 0) return 0;

  const met = MET_STRENGTH[intensity];

  // Active time estimate: ~45 seconds of effort per set
  const activeMinutes = totalSets * 0.75;

  // MET-based metabolic cost
  const metCalories = (met * bodyWeightKg * activeMinutes) / 60;

  // Volume-load bonus: mechanical work
  // ~1 extra kcal per 200 kg lifted across all reps
  const volumeLoad = totalSets * avgReps * Math.max(avgWeightKg, 0);
  const volumeCalories = volumeLoad / 200;

  return Math.round(metCalories + volumeCalories);
}

// ─── Convenience: auto-estimate from a full workout ──────────────────────────

/**
 * Quick estimate for the workout builder — sums calories across all exercises.
 * Used as a fallback when no explicit calorie entry is provided.
 */
export function estimateWorkoutCalories(
  exercises: { sets: number; reps: number; weight_kg: number }[],
  intensity: Intensity = "medium",
  bodyWeightKg = 75
): number {
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  const totalVolume = exercises.reduce((s, e) => s + e.sets * e.reps * Math.max(e.weight_kg, 0), 0);
  const avgReps = exercises.length > 0
    ? exercises.reduce((s, e) => s + e.reps, 0) / exercises.length
    : 10;
  const avgWeight = totalSets > 0 ? totalVolume / (totalSets * avgReps) : 0;

  return calcStrengthCalories(totalSets, avgReps, avgWeight, intensity, bodyWeightKg);
}
