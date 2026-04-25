import { CheckCircle2, Circle } from "lucide-react";

const days = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

// Static placeholder — wire to real workout data when available
const COMPLETED_DAYS: number[] = [];
const TOTAL_GOAL = 3;

export function SportWeeklyProgress() {
  const done = COMPLETED_DAYS.length;
  const pct = Math.min(100, (done / TOTAL_GOAL) * 100);

  return (
    <div className="rounded-3xl bg-white/8 backdrop-blur-md border border-white/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">התקדמות שבועית</h3>
        <span className="text-xs font-semibold text-white/40">{done}/{TOTAL_GOAL} אימונים</span>
      </div>

      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-sport transition-all shadow-[0_0_8px_rgba(0,255,135,0.5)]"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between">
        {days.map((day, i) => {
          const completed = COMPLETED_DAYS.includes(i);
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
