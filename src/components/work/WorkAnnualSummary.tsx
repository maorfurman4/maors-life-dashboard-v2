import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useWorkMonthHistory } from "@/hooks/use-work-data";

const MONTHS_HE = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

const fmt = (n: number) =>
  `₪${Math.round(n).toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;

export function WorkAnnualSummary() {
  const { data: history = [], isLoading } = useWorkMonthHistory();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Last 12 months only
  const rows = (history as any[]).slice(0, 12);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-work/15 bg-card p-6 text-center text-xs text-muted-foreground">
        אין היסטוריה עדיין — סגור חודש כדי לצבור נתונים
      </div>
    );
  }

  const totalGross = rows.reduce((s: number, r: any) => s + Number(r.total_gross_pay || 0), 0);
  const totalShifts = rows.reduce((s: number, r: any) => s + Number(r.total_shifts || 0), 0);
  const totalHours = rows.reduce((s: number, r: any) => s + Number(r.total_hours || 0), 0);

  return (
    <div className="space-y-3">
      {/* Annual totals strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "סה״כ ברוטו", value: fmt(totalGross), color: "text-work" },
          { label: "משמרות", value: String(totalShifts), color: "text-white" },
          { label: "שעות", value: totalHours.toFixed(1), color: "text-white/70" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
            <p className="text-[10px] text-white/40 mb-0.5">{label}</p>
            <p className={`text-sm font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Month rows */}
      <div className="space-y-1.5">
        {rows.map((r: any) => {
          const key = `${r.year}-${r.month}`;
          const label = `${MONTHS_HE[r.month - 1]} ${r.year}`;
          const isExpanded = expandedKey === key;
          const breakdown: Record<string, { count: number; hours: number; gross: number }> =
            r.breakdown_by_type ?? {};

          return (
            <div key={key} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <button
                onClick={() => setExpandedKey(isExpanded ? null : key)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-work" />
                  <span className="text-sm font-bold text-white">{label}</span>
                  <span className="text-[10px] text-white/40">{r.total_shifts} משמרות</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-work">{fmt(Number(r.total_gross_pay || 0))}</span>
                  {isExpanded
                    ? <ChevronUp className="h-3.5 w-3.5 text-white/40" />
                    : <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
                </div>
              </button>

              {isExpanded && Object.keys(breakdown).length > 0 && (
                <div className="border-t border-white/10 px-4 py-3 space-y-1.5">
                  {Object.entries(breakdown).map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <span className="text-white/50">{type} × {data.count}</span>
                      <div className="flex items-center gap-3 text-white/70">
                        <span>{data.hours.toFixed(1)}ש׳</span>
                        <span className="font-bold text-work">{fmt(data.gross)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
