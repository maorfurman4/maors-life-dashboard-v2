import { useWorkMonthHistory, useDeleteWorkMonthHistory, useArchiveWorkMonth } from "@/hooks/use-work-data";
import { ChevronDown, ChevronUp, Trash2, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { SHIFT_LABELS } from "@/lib/payroll-engine";

const MONTH_NAMES = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

export function WorkMonthHistory() {
  const { data: history = [], isLoading } = useWorkMonthHistory();
  const deleteRecord = useDeleteWorkMonthHistory();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (isLoading) return <div className="text-center py-8 text-white/40 text-sm">טוען...</div>;
  if (history.length === 0) return (
    <div className="text-center py-12 text-white/40">
      <p className="text-4xl mb-3">📋</p>
      <p className="text-sm">אין היסטוריה עדיין</p>
      <p className="text-xs mt-1 text-white/25">החודש ייסגר אוטומטית בסיום</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {(history as any[]).map((record) => {
        const key = `${record.year}-${record.month}`;
        const isOpen = expanded === key;
        const isConfirming = confirmDelete === key;
        return (
          <div
            key={key}
            className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden"
          >
            {/* Header row */}
            <div
              className="px-4 py-3 cursor-pointer"
              onClick={() => setExpanded(isOpen ? null : key)}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-white">
                  {MONTH_NAMES[(record.month as number) - 1]} {record.year}
                </p>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Delete button */}
                  {isConfirming ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-red-400">מחק?</span>
                      <button
                        onClick={() => { deleteRecord.mutate(record.id); setConfirmDelete(null); }}
                        disabled={deleteRecord.isPending}
                        className="h-6 w-6 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="h-6 w-6 rounded-lg bg-white/8 flex items-center justify-center text-white/40 hover:bg-white/15"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(key)}
                      className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center text-red-400/40 hover:bg-red-500/15 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                  {isOpen ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-white/40 mt-1">
                <span>{record.total_shifts} משמרות</span>
                <span>{Number(record.total_hours ?? 0).toFixed(1)} שעות</span>
                <span className="text-emerald-400">₪{Number(record.total_gross_pay ?? 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Expanded breakdown */}
            {isOpen && record.breakdown_by_type && (
              <div className="border-t border-white/8 px-4 py-3 space-y-1.5">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">פירוט לפי סוג משמרת</p>
                {Object.entries(record.breakdown_by_type as Record<string, any>).map(([type, data]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-white/60 font-medium">{SHIFT_LABELS[type] ?? type}</span>
                    <span className="text-white/70">
                      <span className="text-emerald-400 font-bold">{data.count}</span> משמרות ·{" "}
                      <span className="text-blue-300">{Math.round(data.hours)} שעות</span> ·{" "}
                      <span className="text-white/50">₪{Math.round(data.gross).toLocaleString()}</span>
                    </span>
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
