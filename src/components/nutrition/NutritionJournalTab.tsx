import { useState } from "react";
import { Trash2, ChevronRight, ChevronLeft, UtensilsCrossed, Loader2 } from "lucide-react";
import { useNutritionEntries, useDeleteNutrition } from "@/hooks/use-sport-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" });
}

function dateLabel(iso: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today)     return "היום";
  if (iso === yesterday) return "אתמול";
  return fmtDate(iso);
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000);
    return d.toISOString().slice(0, 10);
  }).reverse();
}

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── meal slots ──────────────────────────────────────────────────────────────
const MEAL_SLOTS = [
  { key: "breakfast", label: "🌅 ארוחת בוקר" },
  { key: "lunch",     label: "☀️ ארוחת צהריים" },
  { key: "dinner",    label: "🌙 ארוחת ערב" },
  { key: "snack",     label: "🍎 חטיף" },
  { key: "lunch",     label: ""  }, // catch-all for "lunch" defaults
] as const;

const SLOT_MAP: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: "ארוחת בוקר",   emoji: "🌅" },
  lunch:     { label: "ארוחת צהריים", emoji: "☀️" },
  dinner:    { label: "ארוחת ערב",    emoji: "🌙" },
  snack:     { label: "חטיף",         emoji: "🍎" },
};

// ─── 7-day calorie summary hook ──────────────────────────────────────────────
function useWeekCalories(dates: string[]) {
  return useQuery({
    queryKey: ["nutrition-week", dates[0], dates[6]],
    queryFn: async () => {
      const userId = await getUserId();
      const { data } = await supabase
        .from("nutrition_entries")
        .select("date, calories")
        .eq("user_id", userId)
        .gte("date", dates[0])
        .lte("date", dates[6]);
      const map: Record<string, number> = {};
      for (const d of dates) map[d] = 0;
      for (const row of data ?? []) {
        if (row.date && row.calories) map[row.date] = (map[row.date] ?? 0) + (row.calories as number);
      }
      return map;
    },
    staleTime: 60_000,
  });
}

// ─── MacroBar ────────────────────────────────────────────────────────────────
function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein + carbs + fat || 1;
  const pPct  = (protein / total) * 100;
  const cPct  = (carbs   / total) * 100;
  const fPct  = (fat     / total) * 100;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden flex gap-px">
      <div className="rounded-l-full transition-all" style={{ width: `${pPct}%`, background: "#10b981" }} />
      <div className="transition-all"               style={{ width: `${cPct}%`, background: "#f59e0b" }} />
      <div className="rounded-r-full transition-all" style={{ width: `${fPct}%`, background: "#8b5cf6" }} />
    </div>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────
export function NutritionJournalTab() {
  const today   = new Date().toISOString().slice(0, 10);
  const days    = last7Days();
  const [date, setDate]   = useState(today);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useNutritionEntries(date);
  const { data: weekCals }                = useWeekCalories(days);
  const deleteMut                          = useDeleteNutrition();

  // aggregate totals
  const totals = entries.reduce(
    (acc, e: any) => ({
      cal:  acc.cal  + (e.calories ?? 0),
      prot: acc.prot + (e.protein  ?? 0),
      carb: acc.carb + (e.carbs    ?? 0),
      fat:  acc.fat  + (e.fat      ?? 0),
    }),
    { cal: 0, prot: 0, carb: 0, fat: 0 }
  );

  // group by meal_type
  const groups: Record<string, any[]> = {};
  for (const e of entries as any[]) {
    const type = e.meal_type ?? "lunch";
    if (!groups[type]) groups[type] = [];
    groups[type].push(e);
  }

  const maxWeekCal = Math.max(...Object.values(weekCals ?? {}), 1500);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    deleteMut.mutate(id, {
      onSuccess: () => { setDeletingId(null); toast.success("נמחק"); },
      onError:   () => { setDeletingId(null); toast.error("שגיאה במחיקה"); },
    });
  };

  const shiftDate = (dir: -1 | 1) => {
    const d = new Date(date);
    d.setDate(d.getDate() + dir);
    setDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="px-4 pt-4 space-y-5 pb-4">

      {/* ══ WEEK STRIP ══════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
          7 ימים אחרונים
        </p>
        <div className="flex gap-1.5 items-end">
          {days.map((d) => {
            const cal     = weekCals?.[d] ?? 0;
            const barH    = weekCals ? Math.max(8, (cal / maxWeekCal) * 48) : 8;
            const isToday = d === today;
            const isSel   = d === date;
            return (
              <button
                key={d}
                onClick={() => setDate(d)}
                className="flex-1 flex flex-col items-center gap-1 group"
              >
                {/* bar */}
                <div className="w-full flex items-end justify-center" style={{ height: 52 }}>
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      isSel
                        ? "bg-emerald-500"
                        : isToday
                        ? "bg-emerald-500/40"
                        : "bg-white/15 group-hover:bg-white/25"
                    }`}
                    style={{ height: barH }}
                  />
                </div>
                {/* label */}
                <span className={`text-[9px] font-bold ${
                  isSel ? "text-emerald-400" : isToday ? "text-white/70" : "text-white/30"
                }`}>
                  {new Date(d).toLocaleDateString("he-IL", { weekday: "narrow" })}
                </span>
                {cal > 0 && (
                  <span className={`text-[8px] ${isSel ? "text-emerald-300" : "text-white/25"}`}>
                    {cal}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ DATE NAV ════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => shiftDate(-1)}
          className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="flex-1 text-center">
          <p className="text-white font-black text-base">{dateLabel(date)}</p>
          <p className="text-white/30 text-[10px]">{fmtDate(date)}</p>
        </div>

        <button
          onClick={() => shiftDate(1)}
          disabled={date >= today}
          className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* ══ DAILY SUMMARY ═══════════════════════════════════════════════════ */}
      {totals.cal > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-white">סיכום יומי</p>
            <span className="text-lg font-black text-emerald-400">{totals.cal.toLocaleString()} קל׳</span>
          </div>

          <MacroBar protein={totals.prot} carbs={totals.carb} fat={totals.fat} />

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "חלבון",   value: `${Math.round(totals.prot)}g`, color: "text-emerald-400" },
              { label: "פחמימות", value: `${Math.round(totals.carb)}g`, color: "text-amber-400"   },
              { label: "שומן",    value: `${Math.round(totals.fat)}g`,  color: "text-purple-400"  },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/5 border border-white/8 p-2.5">
                <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ LOADING ═════════════════════════════════════════════════════════ */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
          <p className="text-white/40 text-sm">טוען...</p>
        </div>
      )}

      {/* ══ EMPTY STATE ═════════════════════════════════════════════════════ */}
      {!isLoading && entries.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="h-16 w-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center">
            <UtensilsCrossed className="h-7 w-7 text-white/20" />
          </div>
          <p className="text-white/40 text-sm font-medium">אין רשומות לתאריך זה</p>
          <p className="text-white/20 text-xs">הוסף ארוחה מ-Tab 1 ← כפתור +</p>
        </div>
      )}

      {/* ══ MEAL GROUPS ═════════════════════════════════════════════════════ */}
      {!isLoading && Object.keys(groups).length > 0 && (
        <div className="space-y-3">
          {Object.entries(groups).map(([type, items]) => {
            const slot = SLOT_MAP[type] ?? { label: type, emoji: "🍽️" };
            const groupCal = items.reduce((s: number, e: any) => s + (e.calories ?? 0), 0);
            return (
              <div key={type} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
                {/* Group header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{slot.emoji}</span>
                    <p className="text-xs font-black text-white/70">{slot.label}</p>
                  </div>
                  {groupCal > 0 && (
                    <span className="text-xs font-bold text-white/40">{groupCal} קל׳</span>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-0 px-3 pb-3">
                  {items.map((e: any) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0"
                    >
                      {/* Name + macros */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/90 font-medium leading-tight truncate">{e.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {e.calories && (
                            <span className="text-[10px] text-emerald-400 font-bold">{e.calories} קל׳</span>
                          )}
                          {e.protein && (
                            <span className="text-[10px] text-white/30">חלבון {e.protein}g</span>
                          )}
                          {e.carbs && (
                            <span className="text-[10px] text-white/30">פחמימות {e.carbs}g</span>
                          )}
                          {e.fat && (
                            <span className="text-[10px] text-white/30">שומן {e.fat}g</span>
                          )}
                        </div>
                        {e.notes && (
                          <p className="text-[10px] text-white/25 mt-0.5 italic">{e.notes}</p>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(e.id)}
                        disabled={deletingId === e.id}
                        className="h-8 w-8 rounded-xl flex items-center justify-center text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0 disabled:opacity-40"
                      >
                        {deletingId === e.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2  className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* bottom padding for FAB */}
      <div className="h-16" />
    </div>
  );
}
