import { useWorkMonthHistory } from "@/hooks/use-work-data";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const MONTH_NAMES = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

export function WorkMonthHistory() {
  const { data: history = [], isLoading } = useWorkMonthHistory();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <div className="text-center py-8 text-white/40 text-sm">טוען...</div>;
  if (history.length === 0) return (
    <div className="text-center py-12 text-white/40">
      <p className="text-4xl mb-3">📋</p>
      <p className="text-sm">אין היסטוריה עדיין</p>
      <p className="text-xs mt-1 text-white/25">לחץ "סגור חודש" בסיום כל חודש</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {(history as any[]).map((record) => {
        const key = `${record.year}-${record.month}`;
        const isOpen = expanded === key;
        return (
          <div
            key={key}
            className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden cursor-pointer"
            onClick={() => setExpanded(isOpen ? null : key)}
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-white">
                  {MONTH_NAMES[(record.month as number) - 1]} {record.year}
                </p>
                {isOpen ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
              </div>
              <div className="flex gap-4 text-xs text-white/40 mt-1">
                <span>{record.total_shifts} משמרות</span>
                <span>{record.total_hours} שעות</span>
                <span className="text-emerald-400">₪{Number(record.total_gross_pay ?? 0).toLocaleString()}</span>
              </div>
            </div>
            {isOpen && record.breakdown_by_type && (
              <div className="border-t border-white/8 px-4 py-3 space-y-1">
                {Object.entries(record.breakdown_by_type as Record<string, any>).map(([type, data]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-white/40">{type}</span>
                    <span className="text-white/70">{data.count} משמרות · {Math.round(data.hours)} שעות</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
