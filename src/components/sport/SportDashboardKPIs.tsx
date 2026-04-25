import { Target, Flame, Clock, Trophy } from "lucide-react";

interface KPI {
  label: string;
  value: string;
  target?: string;
  icon: React.ComponentType<{ className?: string }>;
  progress?: number;
}

const kpis: KPI[] = [
  { label: "אימונים השבוע", value: "0", target: "3", icon: Target, progress: 0 },
  { label: "דקות השבוע",   value: "0", target: "150", icon: Clock,  progress: 0 },
  { label: "קלוריות",       value: "0", icon: Flame,  progress: 0 },
  { label: "שיאים החודש",  value: "0", icon: Trophy, progress: 0 },
];

export function SportDashboardKPIs() {
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
            <span className="text-2xl font-black text-white">{kpi.value}</span>
            {kpi.target && (
              <span className="text-[10px] text-white/40">/ {kpi.target}</span>
            )}
          </div>

          {kpi.progress !== undefined && (
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-sport transition-all shadow-[0_0_8px_rgba(0,255,135,0.5)]"
                style={{ width: `${kpi.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
