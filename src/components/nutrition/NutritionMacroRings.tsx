import { useNutritionEntries } from "@/hooks/use-sport-data";
import { useUserSettings } from "@/hooks/use-sport-data";

export function NutritionMacroRings() {
  const { data: meals } = useNutritionEntries();
  const { data: settings } = useUserSettings();

  const totalProtein = (meals || []).reduce((s, m) => s + (Number(m.protein_g) || 0), 0);
  const totalCarbs = (meals || []).reduce((s, m) => s + (Number(m.carbs_g) || 0), 0);
  const totalFat = (meals || []).reduce((s, m) => s + (Number(m.fat_g) || 0), 0);

  const macros = [
    { label: "חלבון", current: totalProtein, target: settings?.daily_protein_goal ?? 180, unit: "g", color: "text-nutrition", stroke: "stroke-nutrition" },
    { label: "פחמימות", current: totalCarbs, target: settings?.daily_carbs_goal ?? 280, unit: "g", color: "text-amber-400", stroke: "stroke-amber-400" },
    { label: "שומן", current: totalFat, target: settings?.daily_fat_goal ?? 75, unit: "g", color: "text-rose-400", stroke: "stroke-rose-400" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {macros.map((m) => {
        const pct = m.target > 0 ? Math.min((m.current / m.target) * 100, 100) : 0;
        const dashLen = pct * 2.51;
        return (
          <div key={m.label} className="rounded-xl border border-border bg-card p-3 flex flex-col items-center gap-2">
            <div className="relative h-16 w-16">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" className="stroke-border" strokeWidth="7" />
                <circle cx="50" cy="50" r="40" fill="none" className={m.stroke} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${dashLen} 251`} />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-sm font-black ${m.color}`}>
                {Math.round(pct)}%
              </span>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
              <p className="text-xs font-bold">{Math.round(m.current)}{m.unit} <span className="text-muted-foreground font-normal">/ {m.target}</span></p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
