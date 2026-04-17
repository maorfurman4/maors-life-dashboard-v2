import { Dumbbell, Sofa, Flame, Droplets } from "lucide-react";
import { useState } from "react";

type DayType = "rest" | "training";

const goals = {
  rest: { calories: 2100, protein: 160, water: 2500 },
  training: { calories: 2400, protein: 160, water: 2500 },
};

export function NutritionDynamicGoals() {
  const [dayType, setDayType] = useState<DayType>("rest");
  const g = goals[dayType];

  const current = { calories: 0, protein: 0, water: 0 };
  const calPct = g.calories > 0 ? Math.min((current.calories / g.calories) * 100, 100) : 0;
  const protPct = g.protein > 0 ? Math.min((current.protein / g.protein) * 100, 100) : 0;
  const waterPct = g.water > 0 ? Math.min((current.water / g.water) * 100, 100) : 0;

  return (
    <div className="rounded-2xl border border-nutrition/15 bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">יעדים יומיים</h3>
        <div className="flex rounded-lg bg-secondary/40 p-0.5">
          <button
            onClick={() => setDayType("rest")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-colors min-h-[32px] ${
              dayType === "rest" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Sofa className="h-3 w-3" />
            יום מנוחה
          </button>
          <button
            onClick={() => setDayType("training")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-colors min-h-[32px] ${
              dayType === "training" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Dumbbell className="h-3 w-3" />
            יום אימון
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {[
          { label: "קלוריות", current: current.calories, target: g.calories, unit: "kcal", pct: calPct, color: "stroke-nutrition", textColor: "text-nutrition" },
          { label: "חלבון", current: current.protein, target: g.protein, unit: "g", pct: protPct, color: "stroke-sport", textColor: "text-sport" },
          { label: "מים", current: current.water, target: g.water, unit: "ml", pct: waterPct, color: "stroke-cyan-400", textColor: "text-cyan-400" },
        ].map((item) => {
          const dash = item.pct * 2.51;
          return (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className="relative h-14 w-14 md:h-16 md:w-16">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" className="stroke-border" strokeWidth="7" />
                  <circle cx="50" cy="50" r="40" fill="none" className={item.color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${dash} 251`} />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-black ${item.textColor}`}>
                  {Math.round(item.pct)}%
                </span>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-muted-foreground">{item.label}</p>
                <p className="text-[10px] font-bold">
                  {item.current.toLocaleString()}
                  <span className="text-muted-foreground font-normal"> / {item.target.toLocaleString()}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-center text-muted-foreground">
        {dayType === "training" ? "🏋️ יעדים מוגברים ליום אימון" : "🛋️ יעדים ליום מנוחה"}
      </p>
    </div>
  );
}
