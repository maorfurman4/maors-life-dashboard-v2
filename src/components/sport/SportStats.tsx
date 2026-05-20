import { Timer, Flame, Trophy, Zap } from "lucide-react";
import { useWorkoutHistory, usePersonalRecords } from "@/hooks/use-sport-data";

export function SportStats() {
  const { data: history = [], isLoading: loadingHistory } = useWorkoutHistory();
  const { data: prs = [], isLoading: loadingPRs } = usePersonalRecords();

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const thisMonth = history.filter((w: any) => w.date >= monthStart);
  const monthCount   = thisMonth.length;
  const monthMinutes = thisMonth.reduce((s: number, w: any) => s + (w.duration_minutes || 0), 0);
  const monthCals    = thisMonth.reduce((s: number, w: any) => s + (w.calories_burned || 0), 0);
  const monthPRs     = prs.filter((pr: any) => pr.date >= monthStart).length;

  const hours = Math.floor(monthMinutes / 60);
  const mins  = monthMinutes % 60;
  const timeStr = hours > 0 ? `${hours}ש' ${mins > 0 ? mins + "ד'" : ""}` : `${mins} ד'`;

  const stats = [
    { label: "אימונים החודש", value: String(monthCount),       icon: Zap },
    { label: "זמן כולל",       value: monthMinutes > 0 ? timeStr : "0 ד'", icon: Timer },
    { label: "קלוריות",        value: monthCals > 0 ? monthCals.toLocaleString() : "0", icon: Flame },
    { label: "שיאים אישיים",  value: String(monthPRs),         icon: Trophy },
  ];

  if (loadingHistory || loadingPRs) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-sport/10 bg-card p-3.5 flex items-center gap-3 animate-pulse">
            <div className="h-9 w-9 rounded-lg bg-sport/10 shrink-0" />
            <div className="space-y-1">
              <div className="h-5 w-10 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-sport/10 bg-card p-3.5 flex items-center gap-3"
        >
          <div className="h-9 w-9 rounded-lg bg-sport/10 flex items-center justify-center shrink-0">
            <stat.icon className="h-4 w-4 text-sport" />
          </div>
          <div>
            <p className="text-lg font-black leading-tight">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
