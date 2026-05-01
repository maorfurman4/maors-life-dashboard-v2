import { useProfile } from "@/hooks/use-profile";

// Age is no longer collected — default to 25 for formula purposes
const DEFAULT_AGE = 25;

const LIFESTYLE_MULTIPLIER: Record<string, number> = {
  "אורח חיים יושבני": 1.2,
  "פעילות מתונה": 1.55,
  "פעיל מאוד": 1.725,
};

export function useLifeCalculations() {
  const { data: profile } = useProfile();

  const weight = profile?.weight_kg ?? 70;
  const height = profile?.height_cm ?? 170;
  const gender = profile?.gender ?? "זכר";
  const age = profile?.age ?? DEFAULT_AGE;
  const lifestyle = profile?.lifestyle ?? "פעילות מתונה";

  // Mifflin-St Jeor BMR
  const bmr =
    gender === "נקבה"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;

  const multiplier = LIFESTYLE_MULTIPLIER[lifestyle] ?? 1.55;
  const tdee = Math.round(bmr * multiplier);

  // Approximate caloric burn by workout intensity
  const lightWorkoutBurn = Math.round(tdee * 0.15);
  const moderateWorkoutBurn = Math.round(tdee * 0.25);
  const intenseWorkoutBurn = Math.round(tdee * 0.35);

  return {
    bmr: Math.round(bmr),
    tdee,
    lightWorkoutBurn,
    moderateWorkoutBurn,
    intenseWorkoutBurn,
    lifestyle,
  };
}
