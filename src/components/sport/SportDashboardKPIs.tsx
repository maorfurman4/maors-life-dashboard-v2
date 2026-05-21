import { Target, Flame, Clock, Trophy } from "lucide-react";
import { useWeekWorkouts, usePersonalRecords, useUserSettings } from "@/hooks/use-sport-data";

export function SportDashboardKPIs() {
  const { data: weekWorkouts = [], isLoading: loadingWeek } = useWeekWorkouts();
  const { data: prs = [], isLoading: loadingPRs } = usePersonalRecords();
  const { data: settings } = useUserSettings();

  const weeklyGoal = (settings as any)?.weekly_workouts_goal || 3;
  const minutesGoal = 150;

  const weekCount   = weekWorkouts.length;
  const weekMinutes = weekWorkouts.reduce((s: number, w: any) => s + (w.duration_minutes || 0), 0);
  const weekCals    = weekWorkouts.reduce((s: number, w: any) => s + (w.calories_burned || 0), 0);

  // PRs this month
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthPRs = prs.filter((pr: any) => pr.date >= monthStart).length;

  const isLoading = loadingWeek || loadingPRs;

  const kpis = [
    { label: "אימונים השבוע", value: weekCount, target: weeklyGoal, icon: Target,  progress: Math.min(100, (weekCount / weeklyGoal) * 100) },
    { label: "דקות השבוע",   value: weekMinutes, target: minutesGoal, icon: Clock, progress: Math.min(100, (weekMinutes / minutesGoal) * 100) },
    { label: "קלוריות",       value: weekCals,   target: undefined, icon: Flame,    progress: Math.min(100, (weekCals / 500) * 100) },
    { label: "שיאים החודש",  value: monthPRs,   target: undefined, icon: Trophy,   progress: Math.min(100, monthPRs * 25) },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-3xl bg-white/8 backdrop-blur-md border border-white/10 p-4 space-y-2.5 animate-pulse">
            <div className="h-8 w-8 rounded-xl bg-white/10" />
            <div className="h-6 w-12 bg-white/10 rounded" />
            <div className="h-1.5 w-full bg-white/10 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-3xl bg-white/8 backdrop-blur-md border border-white/10 p-4 space-y-2.5"
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-sport/20 border border-sport/20 flex items-center justify-center">
              <kpi.icon className="h-4 w-4 text-sport" />
            </div>
            <p className="text-[10px] text-white/50 leading-tight font-medium">{kpi.label}</p>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{kpi.value.toLocaleString()}</span>
            {kpi.target !== undefined && (
              <span className="text-[10px] text-white/40">/ {kpi.target}</span>
            )}
          </div>

          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-sport transition-all shadow-[0_0_8px_rgba(0,255,135,0.5)]"
              style={{ width: `${kpi.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
