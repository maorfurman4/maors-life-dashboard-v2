import { TrendingUp, Trophy, Target, Zap } from "lucide-react";
import { usePersonalRecords } from "@/hooks/use-sport-data";

const WEEK_GOAL = 3;
const MONTH_GOAL = 12;

// Static placeholder values — wire up to real workout counts when available
const WEEK_DONE = 0;
const MONTH_DONE = 0;

export function SportProgressSummary() {
  const { data: prs } = usePersonalRecords();
  const topPRs = (prs || []).slice(0, 3);

  const weekPct  = Math.min(100, (WEEK_DONE  / WEEK_GOAL)  * 100);
  const monthPct = Math.min(100, (MONTH_DONE / MONTH_GOAL) * 100);

  return (
    <div className="rounded-3xl bg-white/8 backdrop-blur-md border border-white/10 p-4 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-2xl bg-sport/20 border border-sport/20 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-sport" />
        </div>
        <h3 className="text-sm font-bold text-white">סיכום התקדמות</h3>
      </div>

      {/* Progress bars */}
      <div className="space-y-3">
        {[
          { label: "השבוע",  done: WEEK_DONE,  goal: WEEK_GOAL,  pct: weekPct,  icon: Zap    },
          { label: "החודש",  done: MONTH_DONE, goal: MONTH_GOAL, pct: monthPct, icon: Target },
        ].map(({ label, done, goal, pct, icon: Icon }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-white/40" />
                <span className="text-xs font-semibold text-white/70">{label}</span>
              </div>
              <span className="text-[11px] text-white/40">{done}/{goal} אימונים</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-sport transition-all shadow-[0_0_8px_rgba(0,255,135,0.4)]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Personal Records */}
      {topPRs.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-white/8">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-xs font-bold text-white/70">שיאים אישיים</p>
          </div>
          <div className="space-y-1.5">
            {topPRs.map((pr: any) => (
              <div
                key={pr.id}
                className="flex items-center justify-between text-[11px] border-r-2 border-amber-400/50 pr-2"
              >
                <span className="font-semibold text-white/80 truncate">{pr.exercise_name}</span>
                <span className="text-white/40 shrink-0 ms-2">
                  {pr.weight_kg ? `${pr.weight_kg}kg` : ""}{pr.reps ? ` × ${pr.reps}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topPRs.length === 0 && (
        <p className="text-xs text-white/30 text-center pt-1">
          אין שיאים עדיין — התחל לתעד אימונים
        </p>
      )}
    </div>
  );
}
