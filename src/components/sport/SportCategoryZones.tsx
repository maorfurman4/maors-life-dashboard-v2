import { Dumbbell, Footprints, Shuffle, Weight, type LucideIcon } from "lucide-react";

interface Zone {
  label: string;
  icon: LucideIcon;
  count: number;
  lastSession: string;
  color: string;
  glow: string;
}

const zones: Zone[] = [
  { label: "קליסטניקס", icon: Dumbbell, count: 0, lastSession: "—", color: "text-sport", glow: "rgba(0,255,135,0.3)" },
  { label: "ריצה", icon: Footprints, count: 0, lastSession: "—", color: "text-cyan-400", glow: "rgba(0,229,255,0.3)" },
  { label: "משולב", icon: Shuffle, count: 0, lastSession: "—", color: "text-yellow-400", glow: "rgba(250,204,21,0.3)" },
  { label: "משקולות", icon: Weight, count: 0, lastSession: "—", color: "text-purple-400", glow: "rgba(192,132,252,0.3)" },
];

export function SportCategoryZones() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-muted-foreground">אזורי אימון</h3>
      <div className="grid grid-cols-2 gap-3">
        {zones.map((zone) => (
          <div
            key={zone.label}
            className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-sport/30 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center group-hover:shadow-[0_0_14px_var(--glow)] transition-shadow"
                style={{ "--glow": zone.glow } as React.CSSProperties}
              >
                <zone.icon className={`h-4.5 w-4.5 ${zone.color}`} />
              </div>
              <span className="text-sm font-bold">{zone.label}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{zone.count} אימונים</span>
              <span>אחרון: {zone.lastSession}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
