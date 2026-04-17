import { Circle } from "lucide-react";

const days = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export function SportWeeklyProgress() {
  return (
    <div className="rounded-2xl border border-sport/20 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">התקדמות שבועית</h3>
        <span className="text-xs font-semibold text-muted-foreground">0/3 אימונים</span>
      </div>

      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full bg-sport transition-all" style={{ width: "0%" }} />
      </div>

      <div className="flex justify-between">
        {days.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Circle className="h-6 w-6 text-muted-foreground/30" />
            <span className="text-[10px] font-medium text-muted-foreground/50">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
