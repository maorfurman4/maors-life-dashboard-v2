import { CheckCircle2, Circle } from "lucide-react";
import { useWeekWorkouts, useUserSettings } from "@/hooks/use-sport-data";

const DAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export function SportWeeklyProgress() {
  const { data: weekWorkouts = [], isLoading } = useWeekWorkouts();
  const { data: settings } = useUserSettings();

  const weeklyGoal = (settings as any)?.weekly_workouts_goal || 3;

  // Map workout dates to day-of-week indices (0=Sun … 6=Sat)
  const completedDays = new Set<number>(
    weekWorkouts.map((w: any) => {
      const d = new Date(w.date + "T12:00:00"); // noon to avoid tz edge cases
      return d.getDay();
    })
  );

  const done = completedDays.size;
  const pct  = Math.min(100, (done / weeklyGoal) * 100);

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white/8 backdrop-blur-md border border-white/10 p-4 space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded" />
        <div className="h-1.5 w-full bg-white/10 rounded-full" />
        <div className="flex justify-between">
          {DAY_LABELS.map((_, i) => <div key={i} className="h-6 w-6 rounded-full bg-white/10" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/8 backdrop-blur-md border border-white/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">התקדמות שבועית</h3>
        <span className="text-xs font-semibold text-white/40">{done}/{weeklyGoal} אימונים</span>
      </div>

      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-sport transition-all shadow-[0_0_8px_rgba(0,255,135,0.5)]"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between">
        {DAY_LABELS.map((day, i) => {
          const completed = completedDays.has(i);
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              {completed ? (
                <CheckCircle2 className="h-6 w-6 text-sport" />
              ) : (
                <Circle className="h-6 w-6 text-white/15" />
              )}
              <span className={`text-[10px] font-semibold ${completed ? "text-sport" : "text-white/30"}`}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
