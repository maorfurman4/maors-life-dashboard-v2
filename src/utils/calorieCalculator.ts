/**
 * calorieCalculator.ts — Local Math Engine
 * Calculates calorie burn without any AI/API calls.
 *
 * Cardio:   MET formula — Calories = MET × weight_kg × (minutes / 60)
 *           with EPOC bonus for high-intensity activities and optional age correction.
 *
 * Strength: Hybrid model — MET-based metabolic cost + volume-load contribution.
 *
 * Sources:
 *   - Ainsworth et al. (2011) + 2021 update: Compendium of Physical Activities
 *   - Harvard Health Publishing (2021): Calories burned in 30 minutes tables
 *   - ACSM Guidelines for Exercise Testing & Prescription, 11th Ed.
 *   - Laforgia et al. (J. Sports Sciences): EPOC in high-intensity exercise
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

/** EPOC bonus multiplier by sport key (Laforgia et al., J. Sports Sciences) */
const EPOC_BONUS: Partial<Record<string, number>> = {
  hiit:      0.12, // 12% additional post-exercise calorie burn
  jump_rope: 0.06,
};

export const CARDIO_SPORTS: CardioSport[] = [
  {
    key: "running",
    labelHe: "ריצה",
    emoji: "🏃",
    color: "#f97316",
    // Compendium 2021 + ACSM horizontal running formula cross-validated
    met: { low: 7.0, medium: 9.8, high: 12.3 },
    dbCategory: "running",
  },
  {
    key: "cycling",
    labelHe: "אופניים",
    emoji: "🚴",
    color: "#3b82f6",
    // Compendium 2021: road + stationary combined
    met: { low: 5.8, medium: 8.5, high: 11.0 },
    dbCategory: "mixed",
  },
  {
    key: "swimming",
    labelHe: "שחייה",
    emoji: "🏊",
    color: "#06b6d4",
    // ACSM aquatic activity data (2021)
    met: { low: 5.8, medium: 8.3, high: 10.0 },
    dbCategory: "mixed",
  },
  {
    key: "soccer",
    labelHe: "כדורגל",
    emoji: "⚽",
    color: "#10b981",
    // Intermittent-sprint model; Harvard Health Publishing cross-check
    met: { low: 7.0, medium: 9.0, high: 11.0 },
    dbCategory: "mixed",
  },
  {
    key: "basketball",
    labelHe: "כדורסל",
    emoji: "🏀",
    color: "#f97316",
    met: { low: 6.5, medium: 8.0, high: 10.0 },
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
    // Base MET values; 12% EPOC bonus applied in calcCardioCalories
    met: { low: 8.0, medium: 11.0, high: 14.5 },
    dbCategory: "mixed",
  },
  {
    key: "jump_rope",
    labelHe: "חבל קפיצה",
    emoji: "🪢",
    color: "#eab308",
    // Compendium 2021 update
    met: { low: 8.8, medium: 11.0, high: 13.8 },
    dbCategory: "mixed",
  },
  {
    key: "rowing",
    labelHe: "חתירה",
    emoji: "🚣",
    color: "#6366f1",
    // Olympic-style rowing ergometer data
    met: { low: 7.0, medium: 9.0, high: 12.0 },
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
    // Karate/MMA — Compendium 2021
    met: { low: 7.0, medium: 9.5, high: 12.0 },
    dbCategory: "mixed",
  },
];

// ─── Cardio calorie formula ───────────────────────────────────────────────────

/**
 * Age-based VO2max correction factor.
 * Harvard / ACSM data: ~0.8% VO2max decline per year after age 30, capped at -25%.
 */
function ageCorrection(ageYears?: number): number {
  if (!ageYears || ageYears <= 30) return 1.0;
  return 1 - Math.min((ageYears - 30) * 0.008, 0.25);
}

/**
 * Pace-based energy coefficient for running.
 * Source: Margaria et al. — net caloric cost of running ≈ 1 kcal/kg/km,
 * adjusted for pace efficiency (Harvard Medical School cross-validated).
 */
function runningPaceCoefficient(paceMinPerKm: number): number {
  if (paceMinPerKm > 7) return 0.80;   // fast walk / very slow jog
  if (paceMinPerKm > 6) return 0.92;   // easy jog
  if (paceMinPerKm > 5) return 1.036;  // moderate run
  if (paceMinPerKm > 4) return 1.10;   // fast run
  return 1.20;                          // sprint
}

/**
 * Cardio calorie estimate.
 * Running (when distanceKm provided): Calories = weight_kg × distance_km × C × ageCorrection × (1 + EPOC)
 *   where C is a pace-based coefficient (Margaria/Harvard distance model).
 * Other sports: Calories = MET × weight_kg × (minutes / 60) × ageCorrection × (1 + EPOC)
 *
 * @param sportKey    - key from CARDIO_SPORTS
 * @param intensity   - "low" | "medium" | "high"
 * @param minutes     - duration in minutes
 * @param weightKg    - user body weight in kg (default 75)
 * @param ageYears    - optional age for VO2max correction
 * @param distanceKm  - optional distance for running (enables distance-based formula)
 */
export function calcCardioCalories(
  sportKey: string,
  intensity: Intensity,
  minutes: number,
  weightKg = 75,
  ageYears?: number,
  distanceKm?: number
): number {
  if (minutes <= 0 || weightKg <= 0) return 0;

  // Distance-based formula for running (more accurate than time-only)
  if (sportKey === "running" && distanceKm && distanceKm > 0 && minutes > 0) {
    const pace = minutes / distanceKm; // min/km
    const C = runningPaceCoefficient(pace);
    const netCalories = weightKg * distanceKm * C;
    const epocBonus = 1.08; // 8% EPOC for running (Laforgia et al.)
    return Math.round(netCalories * epocBonus * ageCorrection(ageYears));
  }

  // Standard MET formula (fallback for running without distance, and all other sports)
  const sport = CARDIO_SPORTS.find((s) => s.key === sportKey);
  const met = sport?.met[intensity] ?? 8.0;
  const base = met * weightKg * (minutes / 60);
  const epoc = 1 + (EPOC_BONUS[sportKey] ?? 0);
  return Math.round(base * epoc * ageCorrection(ageYears));
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
