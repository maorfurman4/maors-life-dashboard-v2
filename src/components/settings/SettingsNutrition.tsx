import { useState } from "react";
import { Apple } from "lucide-react";

interface NutritionGoals {
  calories: string;
  trainingCalories: string;
  protein: string;
  trainingProtein: string;
  carbs: string;
  fat: string;
  waterMl: string;
  waterGlasses: string;
}

export function SettingsNutrition() {
  const [goals, setGoals] = useState<NutritionGoals>({
    calories: "",
    trainingCalories: "",
    protein: "",
    trainingProtein: "",
    carbs: "",
    fat: "",
    waterMl: "",
    waterGlasses: "",
  });

  const update = (key: keyof NutritionGoals, value: string) =>
    setGoals((prev) => ({ ...prev, [key]: value }));

  const fields: { key: keyof NutritionGoals; label: string; unit: string }[] = [
    { key: "calories", label: "קלוריות — יום מנוחה", unit: "kcal" },
    { key: "trainingCalories", label: "קלוריות — יום אימון", unit: "kcal" },
    { key: "protein", label: "חלבון — יום מנוחה", unit: "g" },
    { key: "trainingProtein", label: "חלבון — יום אימון", unit: "g" },
    { key: "carbs", label: "פחמימות", unit: "g" },
    { key: "fat", label: "שומן", unit: "g" },
    { key: "waterMl", label: "מים יומי", unit: "ml" },
    { key: "waterGlasses", label: "כוסות מים", unit: "כוסות" },
  ];

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Apple className="h-4 w-4 text-nutrition" />
        <h3 className="text-sm font-semibold">יעדי תזונה</h3>
      </div>
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3">
            <label className="text-sm text-muted-foreground">{f.label}</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={goals[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder="—"
                className="w-20 rounded-lg bg-secondary/40 border border-border px-3 py-2 text-sm text-left placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-nutrition min-h-[44px]"
                dir="ltr"
              />
              <span className="text-xs text-muted-foreground w-12">{f.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
