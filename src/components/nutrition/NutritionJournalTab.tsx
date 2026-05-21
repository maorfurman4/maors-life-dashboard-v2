import { useState, useRef } from "react";
import { Trash2, ChevronRight, ChevronLeft, UtensilsCrossed, Loader2, Download, FileText, Copy } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNutritionEntries, useDeleteNutrition, useUserSettings } from "@/hooks/use-sport-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { localDateStr, todayLocalStr, yesterdayLocalStr, lastDayOfMonth } from "@/utils/date";
import { toast } from "sonner";

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" });
}

function dateLabel(iso: string) {
  const today     = todayLocalStr();
  const yesterday = yesterdayLocalStr();
  if (iso === today)     return "היום";
  if (iso === yesterday) return "אתמול";
  return fmtDate(iso);
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return localDateStr(d);
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

// ─── monthly nutrition hook (for exports) ────────────────────────────────────
async function fetchMonthlyEntries(year: number, month: number) {
  const userId = await getUserId();
  const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay  = lastDayOfMonth(year, month + 1);
  const { data } = await (supabase as any)
    .from("nutrition_entries")
    .select("date, calories, protein_g, carbs_g, fat_g")
    .eq("user_id", userId)
    .gte("date", firstDay)
    .lte("date", lastDay);
  // group by date
  const map: Record<string, { cal: number; prot: number; carb: number; fat: number; count: number }> = {};
  for (const row of (data ?? []) as any[]) {
    const d = row.date as string;
    if (!map[d]) map[d] = { cal: 0, prot: 0, carb: 0, fat: 0, count: 0 };
    map[d].cal  += (row.calories  ?? 0);
    map[d].prot += (row.protein_g ?? 0);
    map[d].carb += (row.carbs_g   ?? 0);
    map[d].fat  += (row.fat_g     ?? 0);
    map[d].count += 1;
  }
  return map;
}

const HEBREW_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

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
  const today   = todayLocalStr();
  const days    = last7Days();
  const [date, setDate]   = useState(today);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const queryClient                        = useQueryClient();
  const [isCopyingYesterday, setIsCopyingYesterday] = useState(false);
  const { data: entries = [], isLoading } = useNutritionEntries(date);
  const { data: weekCals }                = useWeekCalories(days);
  const deleteMut                          = useDeleteNutrition();
  const { data: userSettings }            = useUserSettings();

  // macro goals from settings (with defaults); guard against explicit 0 to avoid division-by-zero
  const caloriesGoal = userSettings?.daily_calories_goal || 2000;
  const proteinGoal  = userSettings?.daily_protein_goal  || 150;
  const carbsGoal    = userSettings?.daily_carbs_goal    || 250;
  const fatGoal      = userSettings?.daily_fat_goal      || 65;

  const handleCopyYesterday = async () => {
    setIsCopyingYesterday(true);
    try {
      const userId = await getUserId();
      const yesterdayStr = yesterdayLocalStr();
      const todayStr     = todayLocalStr();

      const { data: yesterdayEntries, error: fetchError } = await supabase
        .from("nutrition_entries")
        .select("*")
        .eq("user_id", userId)
        .eq("date", yesterdayStr);

      if (fetchError) throw fetchError;
      if (!yesterdayEntries || yesterdayEntries.length === 0) {
        toast.info("לא נמצאו ארוחות אתמול");
        return;
      }

      const newEntries = yesterdayEntries.map(({ id, created_at, ...rest }: any) => ({
        ...rest,
        date: todayStr,
      }));

      const { error: insertError } = await supabase.from("nutrition_entries").insert(newEntries);
      if (insertError) throw insertError;

      await queryClient.invalidateQueries({ queryKey: ["nutrition-entries"] });
      await queryClient.invalidateQueries({ queryKey: ["nutrition-week"] });
      await queryClient.invalidateQueries({ queryKey: ["nutrition-weekly-summary"] });
      toast.success("✅ ארוחות אתמול הועתקו ליום היום");
    } catch {
      toast.error("שגיאה בהעתקת ארוחות");
    } finally {
      setIsCopyingYesterday(false);
    }
  };

  // aggregate totals
  const totals = entries.reduce(
    (acc, e: any) => ({
      cal:   acc.cal   + (e.calories  ?? 0),
      prot:  acc.prot  + (e.protein_g ?? 0),
      carb:  acc.carb  + (e.carbs_g  ?? 0),
      fat:   acc.fat   + (e.fat_g    ?? 0),
      fiber: acc.fiber + (e.fiber_g   ?? 0),
    }),
    { cal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 }
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
    // Parse YYYY-MM-DD without timezone shift: add local noon to avoid DST edge cases
    const [y, m, day] = date.split("-").map(Number);
    const d = new Date(y, m - 1, day + dir);
    setDate(localDateStr(d));
  };

  const now = new Date();
  const exportYear  = now.getFullYear();
  const exportMonth = now.getMonth();

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const map = await fetchMonthlyEntries(exportYear, exportMonth);
      const rows = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
      const header = "תאריך,קלוריות,חלבון (גר'),פחמימות (גר'),שומן (גר'),מספר ארוחות\n";
      const body = rows.map(([d, v]) =>
        `${d},${Math.round(v.cal)},${Math.round(v.prot)},${Math.round(v.carb)},${Math.round(v.fat)},${v.count}`
      ).join("\n");
      const csvContent = header + body;
      const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `תזונה-${exportYear}-${String(exportMonth + 1).padStart(2, "0")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("קובץ CSV יוצא בהצלחה");
    } catch {
      toast.error("שגיאה בייצוא CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const map  = await fetchMonthlyEntries(exportYear, exportMonth);
      const rows = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
      const totRow = rows.reduce(
        (acc, [, v]) => ({ cal: acc.cal + v.cal, prot: acc.prot + v.prot, carb: acc.carb + v.carb, fat: acc.fat + v.fat }),
        { cal: 0, prot: 0, carb: 0, fat: 0 }
      );
      const tableRows = rows.map(([d, v]) =>
        `<tr><td>${d}</td><td>${Math.round(v.cal)}</td><td>${Math.round(v.prot)}</td><td>${Math.round(v.carb)}</td><td>${Math.round(v.fat)}</td></tr>`
      ).join("");
      // Inject print styles into <head> so they actually override Tailwind's .hidden class
      const styleId = "nutrition-print-style";
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `@media print { body > *:not(#nutrition-print-area) { display: none !important; } #nutrition-print-area { display: block !important; direction: rtl; font-family: Arial, sans-serif; } #nutrition-print-area table { width: 100%; border-collapse: collapse; } #nutrition-print-area th, #nutrition-print-area td { border: 1px solid #ccc; padding: 6px 10px; text-align: right; } #nutrition-print-area th { background: #f0f0f0; } #nutrition-print-area tfoot td { font-weight: bold; background: #e8f5e9; } }`;
      if (printRef.current) {
        printRef.current.innerHTML = `
          <h2 style="text-align:center">דוח תזונה — ${HEBREW_MONTHS[exportMonth]} ${exportYear}</h2>
          <table>
            <thead><tr><th>תאריך</th><th>קלוריות</th><th>חלבון</th><th>פחמימות</th><th>שומן</th></tr></thead>
            <tbody>${tableRows}</tbody>
            <tfoot><tr><td>סה"כ</td><td>${Math.round(totRow.cal)}</td><td>${Math.round(totRow.prot)}</td><td>${Math.round(totRow.carb)}</td><td>${Math.round(totRow.fat)}</td></tr></tfoot>
          </table>
        `;
      }
      window.print();
    } catch {
      toast.error("שגיאה בייצוא PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="px-4 pt-4 space-y-5 pb-4">

      {/* ══ EXPORT BUTTONS ══════════════════════════════════════════════════ */}
      <div className="flex gap-2 justify-end flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyYesterday}
          disabled={isCopyingYesterday}
          className="text-xs h-8 gap-1.5"
        >
          {isCopyingYesterday ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
          העתק מאתמול
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={isExporting}
          className="text-xs h-8 gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          ייצוא CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          disabled={isExporting}
          className="text-xs h-8 gap-1.5"
        >
          <FileText className="h-3.5 w-3.5" />
          ייצוא PDF
        </Button>
      </div>

      {/* hidden print area for PDF export */}
      <div id="nutrition-print-area" ref={printRef} className="hidden print:block" />

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

          {/* Calories progress bar */}
          {(() => {
            const calPct = Math.min(100, Math.round((totals.cal / caloriesGoal) * 100));
            return (
              <div>
                <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                  <div className="bg-orange-500 h-1.5 rounded-full transition-all" style={{ width: `${calPct}%` }} />
                </div>
                <span className="text-[10px] text-white/40">{calPct}% מהיעד היומי ({caloriesGoal} קל׳)</span>
              </div>
            );
          })()}

          <MacroBar protein={totals.prot} carbs={totals.carb} fat={totals.fat} />

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "חלבון",   value: Math.round(totals.prot), goal: proteinGoal,  color: "text-emerald-400", barColor: "bg-blue-500",   sub: null },
              { label: "פחמימות", value: Math.round(totals.carb), goal: carbsGoal,    color: "text-amber-400",   barColor: "bg-yellow-500", sub: totals.fiber > 0 ? `נטו: ${Math.max(0, Math.round(totals.carb - totals.fiber))}ג` : null },
              { label: "שומן",    value: Math.round(totals.fat),  goal: fatGoal,      color: "text-purple-400",  barColor: "bg-purple-500", sub: null },
            ].map((s) => {
              const pct = s.goal > 0 ? Math.min(100, Math.round((s.value / s.goal) * 100)) : 0;
              return (
                <div key={s.label} className="rounded-xl bg-white/5 border border-white/8 p-2.5">
                  <p className={`text-sm font-black ${s.color}`}>{s.value}g</p>
                  {s.sub && <p className="text-[8px] text-white/30">{s.sub}</p>}
                  <p className="text-[9px] text-white/40 mt-0.5">{s.label}</p>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5">
                    <div className={`${s.barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-white/30">{pct}% מהיעד</span>
                </div>
              );
            })}
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
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-5xl">🥗</span>
          <p className="text-white/60 text-sm font-medium">אין מנות היום</p>
          <p className="text-white/30 text-xs">הוסף את הארוחה הראשונה שלך!</p>
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
                          {e.protein_g != null && e.protein_g > 0 && (
                            <span className="text-[10px] text-white/30">חלבון {e.protein_g}g</span>
                          )}
                          {e.carbs_g != null && e.carbs_g > 0 && (
                            <span className="text-[10px] text-white/30">פחמימות {e.carbs_g}g</span>
                          )}
                          {e.fat_g != null && e.fat_g > 0 && (
                            <span className="text-[10px] text-white/30">שומן {e.fat_g}g</span>
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
