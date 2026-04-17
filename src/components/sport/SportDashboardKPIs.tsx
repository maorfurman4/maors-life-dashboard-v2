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
  { label: "דקות השבוע", value: "0", target: "150", icon: Clock, progress: 0 },
  { label: "קלוריות שנשרפו", value: "0", icon: Flame, progress: 0 },
  { label: "שיאים החודש", value: "0", icon: Trophy, progress: 0 },
];

export function SportDashboardKPIs() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="rounded-xl border border-border bg-card p-3.5 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sport/10 flex items-center justify-center">
              <kpi.icon className="h-4 w-4 text-sport" />
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</p>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black">{kpi.value}</span>
            {kpi.target && (
              <span className="text-[10px] text-muted-foreground">/ {kpi.target}</span>
            )}
          </div>

          {kpi.progress !== undefined && (
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-sport transition-all" style={{ width: `${kpi.progress}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
