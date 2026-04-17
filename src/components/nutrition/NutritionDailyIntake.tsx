import { Flame, Droplets } from "lucide-react";

export function NutritionDailyIntake() {
  const calories = { current: 0, target: 2400 };
  const water = { current: 0, target: 8 };

  const calPct = calories.target > 0 ? Math.min((calories.current / calories.target) * 100, 100) : 0;
  const waterPct = water.target > 0 ? Math.min((water.current / water.target) * 100, 100) : 0;

  return (
    <div className="rounded-2xl border border-nutrition/15 bg-card p-5 space-y-4">
      <h3 className="text-sm font-bold">צריכה יומית</h3>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-nutrition" />
            <span className="font-medium">קלוריות</span>
          </div>
          <span className="text-muted-foreground">
            <span className="font-bold text-foreground">{calories.current.toLocaleString()}</span> / {calories.target.toLocaleString()}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-border overflow-hidden">
          <div className="h-full rounded-full bg-nutrition transition-all" style={{ width: `${calPct}%` }} />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-medium">מים</span>
          </div>
          <span className="text-muted-foreground">
            <span className="font-bold text-foreground">{water.current}</span> / {water.target} כוסות
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: water.target }).map((_, i) => (
            <div key={i} className={`h-2.5 flex-1 rounded-full transition-colors ${i < water.current ? "bg-cyan-400" : "bg-border"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
