import { useState } from "react";
import { Dumbbell, AlertTriangle } from "lucide-react";

interface SportGoals {
  weeklyWorkouts: string;
  weeklyMinutes: string;
  weeklyCalories: string;
  shoulderSensitivity: boolean;
}

export function SettingsSport() {
  const [goals, setGoals] = useState<SportGoals>({
    weeklyWorkouts: "3",
    weeklyMinutes: "150",
    weeklyCalories: "1500",
    shoulderSensitivity: true,
  });

  const update = (key: keyof SportGoals, value: string | boolean) =>
    setGoals((prev) => ({ ...prev, [key]: value }));

  const fields: { key: keyof Omit<SportGoals, "shoulderSensitivity">; label: string; unit: string }[] = [
    { key: "weeklyWorkouts", label: "אימונים בשבוע", unit: "אימונים" },
    { key: "weeklyMinutes", label: "דקות שבועיות", unit: "דקות" },
    { key: "weeklyCalories", label: "שריפת קלוריות", unit: "kcal" },
  ];

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-4 w-4 text-sport" />
        <h3 className="text-sm font-semibold">יעדי ספורט</h3>
      </div>
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3">
            <label className="text-sm text-muted-foreground">{f.label}</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={goals[f.key] as string}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-20 rounded-lg bg-secondary/40 border border-border px-3 py-2 text-sm text-left focus:outline-none focus:ring-1 focus:ring-sport min-h-[44px]"
                dir="ltr"
              />
              <span className="text-xs text-muted-foreground w-14">{f.unit}</span>
            </div>
          </div>
        ))}

        {/* Shoulder sensitivity */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <label className="text-sm text-muted-foreground">רגישות כתפיים</label>
          </div>
          <button
            onClick={() => update("shoulderSensitivity", !goals.shoulderSensitivity)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              goals.shoulderSensitivity ? "bg-sport" : "bg-secondary"
            }`}
          >
            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${
              goals.shoulderSensitivity ? "right-0.5" : "left-0.5"
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
}
