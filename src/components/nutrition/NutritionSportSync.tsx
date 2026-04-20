import { Dumbbell, TrendingUp, Zap } from "lucide-react";
import { useUserSettings } from "@/hooks/use-sport-data";

// Calorie adjustment per RPE level relative to rest day
const RPE_ADJUSTMENT: Record<number, number> = {
  1: 0, 2: 50, 3: 100, 4: 150, 5: 200,
  6: 250, 7: 300, 8: 400, 9: 500, 10: 600,
};

interface Props {
  rpe?: number; // 1–10, passed from sport plan when available
  isTrainingDay?: boolean;
}

export function NutritionSportSync({ rpe = 7, isTrainingDay = false }: Props) {
  const { data: settings } = useUserSettings();

  const baseCalories = (settings as any)?.daily_calories_goal ?? 2000;
  const trainingCalories = (settings as any)?.training_day_calories ?? baseCalories + 300;
  const adjustment = RPE_ADJUSTMENT[rpe] ?? 0;
  const suggestedCalories = isTrainingDay ? trainingCalories : baseCalories;
  const proteinGoal = isTrainingDay
    ? Math.round(((settings as any)?.training_day_protein ?? 160))
    : Math.round(((settings as any)?.daily_protein_goal ?? 130));

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 transition-colors ${
        isTrainingDay
          ? "border-sport/30 bg-gradient-to-br from-sport/5 to-transparent"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-sport/10 flex items-center justify-center">
            <Dumbbell className="h-4 w-4 text-sport" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ letterSpacing: 0 }}>
              סנכרון ספורט–תזונה
            </h3>
            <p className="text-xs text-muted-foreground">
              {isTrainingDay ? "יום אימון — יעדים מותאמים" : "יום מנוחה — יעדים בסיסיים"}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {}}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
              !isTrainingDay ? "border-border bg-secondary/30 text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            מנוחה
          </button>
          <button
            onClick={() => {}}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
              isTrainingDay ? "border-sport/40 bg-sport/10 text-sport" : "border-transparent text-muted-foreground"
            }`}
          >
            אימון
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-secondary/30 border border-border p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground">קלוריות יעד</p>
          <p className="text-base font-black mt-0.5">{suggestedCalories.toLocaleString("he")}</p>
        </div>
        <div className="rounded-xl bg-secondary/30 border border-border p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground">חלבון יעד</p>
          <p className="text-base font-black mt-0.5">{proteinGoal}g</p>
        </div>
        <div className="rounded-xl bg-secondary/30 border border-border p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground">RPE</p>
          <div className="flex items-center justify-center gap-0.5 mt-0.5">
            <Zap className="h-3.5 w-3.5 text-sport" />
            <p className="text-base font-black">{rpe}</p>
          </div>
        </div>
      </div>

      {isTrainingDay && adjustment > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-sport">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>+{adjustment} קל׳ נוספות בגלל עוצמת האימון (RPE {rpe})</span>
        </div>
      )}
    </div>
  );
}
