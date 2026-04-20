import { TrendingUp, Trophy, Target, Zap, ChevronRight } from "lucide-react";
import { usePersonalRecords } from "@/hooks/use-sport-data";

const WEEK_GOAL = 3;
const MONTH_GOAL = 12;

// Static placeholder values — wire up to real workout counts when available
const WEEK_DONE = 0;
const MONTH_DONE = 0;

export function SportProgressSummary() {
  const { data: prs } = usePersonalRecords();
  const topPRs = (prs || []).slice(0, 3);

  const weekPct = Math.min(100, (WEEK_DONE / WEEK_GOAL) * 100);
  const monthPct = Math.min(100, (MONTH_DONE / MONTH_GOAL) * 100);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-sport/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-sport" />
        </div>
        <h3 className="text-sm font-semibold">סיכום התקדמות</h3>
      </div>

      {/* Weekly & monthly progress bars */}
      <div className="space-y-2.5">
        {[
          { label: "השבוע", done: WEEK_DONE, goal: WEEK_GOAL, pct: weekPct, icon: Zap },
          { label: "החודש", done: MONTH_DONE, goal: MONTH_GOAL, pct: monthPct, icon: Target },
        ].map(({ label, done, goal, pct, icon: Icon }) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {done}/{goal} אימונים
              </span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-sport transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Personal Records */}
      {topPRs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-xs font-semibold">שיאים אישיים</p>
          </div>
          <div className="space-y-1">
            {topPRs.map((pr: any) => (
              <div key={pr.id} className="flex items-center justify-between text-[11px] border-r-2 border-amber-400/40 pr-2">
                <span className="font-medium truncate">{pr.exercise_name}</span>
                <span className="text-muted-foreground shrink-0 ms-2">
                  {pr.weight_kg ? `${pr.weight_kg}kg` : ""}{pr.reps ? ` × ${pr.reps}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topPRs.length === 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>אין שיאים עדיין — התחל לתעד אימונים</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}
