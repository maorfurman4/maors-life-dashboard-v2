// Israeli Ministry of Health "Nutritional Rainbow" red label thresholds (per 100g)
export interface NutrimentsPer100g {
  calories?: number;
  sugar_g?: number;
  sodium_mg?: number;
  saturated_fat_g?: number;
  fat_g?: number;
}

export interface RedLabel {
  key: string;
  label: string;
  severity: "high" | "very_high";
}

export function detectRedLabels(n: NutrimentsPer100g): RedLabel[] {
  const labels: RedLabel[] = [];

  if ((n.sugar_g ?? 0) > 13.3) {
    labels.push({ key: "sugar", label: "סוכר גבוה", severity: (n.sugar_g ?? 0) > 22 ? "very_high" : "high" });
  }
  if ((n.sodium_mg ?? 0) > 600) {
    labels.push({ key: "sodium", label: "נתרן גבוה", severity: (n.sodium_mg ?? 0) > 900 ? "very_high" : "high" });
  }
  if ((n.saturated_fat_g ?? 0) > 3) {
    labels.push({ key: "sat_fat", label: "שומן רווי גבוה", severity: (n.saturated_fat_g ?? 0) > 5 ? "very_high" : "high" });
  }
  if ((n.calories ?? 0) > 400) {
    labels.push({ key: "calories", label: "קלוריות גבוהות", severity: (n.calories ?? 0) > 550 ? "very_high" : "high" });
  }

  return labels;
}

export function redLabelColor(severity: RedLabel["severity"]) {
  return severity === "very_high" ? "bg-red-600/15 border-red-600/30 text-red-600" : "bg-orange-500/15 border-orange-500/30 text-orange-500";
}
