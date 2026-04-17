import { Timer, Flame, Trophy, Zap } from "lucide-react";

const stats = [
  { label: "אימונים החודש", value: "0", icon: Zap },
  { label: "זמן כולל", value: "0 שעות", icon: Timer },
  { label: "קלוריות", value: "0", icon: Flame },
  { label: "שיאים אישיים", value: "0", icon: Trophy },
];

export function SportStats() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-sport/10 bg-card p-3.5 flex items-center gap-3"
        >
          <div className="h-9 w-9 rounded-lg bg-sport/10 flex items-center justify-center shrink-0">
            <stat.icon className="h-4.5 w-4.5 text-sport" />
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
