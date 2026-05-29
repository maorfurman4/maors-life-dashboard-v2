import { useState, useRef } from "react";
import { Trash2, ChevronRight, ChevronLeft, UtensilsCrossed, Loader2, Download, FileText, Copy } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNutritionEntries, useDeleteNutrition, useUserSettings } from "@/hooks/use-sport-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
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
function useWeekCalories(dates: string[], userId: string | undefined) {
  return useQuery({
    queryKey: ["nutrition-week", userId, dates[0], dates[6]],
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
interface MealEntry {
  date: string;
  name: string;
  meal_type: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes: string;
}

interface DailyTotals {
  cal: number;
  prot: number;
  carb: number;
  fat: number;
  count: number;
}

async function fetchMonthlyEntries(year: number, month: number): Promise<{
  map: Record<string, DailyTotals>;
  entries: MealEntry[];
}> {
  const userId = await getUserId();
  const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay  = lastDayOfMonth(year, month + 1);
  const { data } = await (supabase as any)
    .from("nutrition_entries")
    .select("date, name, meal_type, calories, protein_g, carbs_g, fat_g, notes")
    .eq("user_id", userId)
    .gte("date", firstDay)
    .lte("date", lastDay)
    .order("date", { ascending: true });
  // group by date
  const map: Record<string, DailyTotals> = {};
  const entries: MealEntry[] = [];
  for (const row of (data ?? []) as any[]) {
    const d = row.date as string;
    if (!map[d]) map[d] = { cal: 0, prot: 0, carb: 0, fat: 0, count: 0 };
    map[d].cal  += (row.calories  ?? 0);
    map[d].prot += (row.protein_g ?? 0);
    map[d].carb += (row.carbs_g   ?? 0);
    map[d].fat  += (row.fat_g     ?? 0);
    map[d].count += 1;
    entries.push({
      date:      row.date ?? "",
      name:      row.name ?? "",
      meal_type: row.meal_type ?? "lunch",
      calories:  row.calories  ?? 0,
      protein_g: row.protein_g ?? 0,
      carbs_g:   row.carbs_g   ?? 0,
      fat_g:     row.fat_g     ?? 0,
      notes:     row.notes     ?? "",
    });
  }
  return { map, entries };
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

  const { user } = useAuth();
  const userId = user?.id;
  const queryClient                        = useQueryClient();
  const [isCopyingYesterday, setIsCopyingYesterday] = useState(false);
  const { data: entries = [], isLoading } = useNutritionEntries(date);
  const { data: weekCals }                = useWeekCalories(days, userId);
  const deleteMut                          = useDeleteNutrition();
  const { data: userSettings }            = useUserSettings();
  const { data: profile }                 = useProfile();

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
      await queryClient.invalidateQueries({ queryKey: ["nutrition-week", userId] });
      await queryClient.invalidateQueries({ queryKey: ["nutrition-weekly-summary", userId] });
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

  const MEAL_LABELS_HE: Record<string, string> = {
    breakfast: "ארוחת בוקר",
    lunch:     "ארוחת צהריים",
    dinner:    "ארוחת ערב",
    snack:     "חטיף",
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const { entries: mealEntries } = await fetchMonthlyEntries(exportYear, exportMonth);
      const header = ["תאריך", "ארוחה", "שם", "קלוריות", "חלבון(g)", "פחמימות(g)", "שומן(g)", "הערות"];
      const rows = mealEntries.map((e) => [
        e.date,
        MEAL_LABELS_HE[e.meal_type] ?? e.meal_type,
        `"${e.name.replace(/"/g, '""')}"`,
        String(Math.round(e.calories)),
        String(Math.round(e.protein_g)),
        String(Math.round(e.carbs_g)),
        String(Math.round(e.fat_g)),
        `"${e.notes.replace(/"/g, '""')}"`,
      ]);
      const csvContent = [header, ...rows].map((r) => r.join(",")).join("\n");
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
      const { map, entries: mealEntries } = await fetchMonthlyEntries(exportYear, exportMonth);
      const sortedDates = Object.keys(map).sort();
      const totRow = sortedDates.reduce(
        (acc, d) => ({ cal: acc.cal + map[d].cal, prot: acc.prot + map[d].prot, carb: acc.carb + map[d].carb, fat: acc.fat + map[d].fat }),
        { cal: 0, prot: 0, carb: 0, fat: 0 }
      );
      const userName = profile?.full_name ?? "";
      const todayDisplay = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

      // Build HTML for each day with its meals
      const dayBlocks = sortedDates.map((d) => {
        const dayMeals = mealEntries.filter((e) => e.date === d);
        const dayTotals = map[d];
        const dateFormatted = new Date(d).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
        const mealRows = dayMeals.map((e) => `
          <tr class="meal-row">
            <td class="meal-name">${e.name || "—"}</td>
            <td class="meal-type">${MEAL_LABELS_HE[e.meal_type] ?? e.meal_type}</td>
            <td class="cal-cell">${Math.round(e.calories)}</td>
            <td class="prot-cell">${Math.round(e.protein_g)}g</td>
            <td class="carb-cell">${Math.round(e.carbs_g)}g</td>
            <td class="fat-cell">${Math.round(e.fat_g)}g</td>
            <td class="notes-cell">${e.notes || ""}</td>
          </tr>
        `).join("");
        return `
          <div class="day-section">
            <div class="day-header">${dateFormatted}</div>
            <table>
              <thead>
                <tr>
                  <th>שם</th><th>ארוחה</th>
                  <th class="cal-cell">קלוריות</th>
                  <th class="prot-cell">חלבון</th>
                  <th class="carb-cell">פחמימות</th>
                  <th class="fat-cell">שומן</th>
                  <th class="notes-cell">הערות</th>
                </tr>
              </thead>
              <tbody>${mealRows}</tbody>
              <tfoot>
                <tr class="day-total-row">
                  <td colspan="2">סה&quot;כ יומי</td>
                  <td class="cal-cell">${Math.round(dayTotals.cal)}</td>
                  <td class="prot-cell">${Math.round(dayTotals.prot)}g</td>
                  <td class="carb-cell">${Math.round(dayTotals.carb)}g</td>
                  <td class="fat-cell">${Math.round(dayTotals.fat)}g</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;
      }).join("");

      // Inject print styles into <head>
      const styleId = "nutrition-print-style";
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        @media print {
          body > *:not(#nutrition-print-area) { display: none !important; }
          #nutrition-print-area {
            display: block !important; direction: rtl;
            font-family: Arial, sans-serif; padding: 24px; color: #111;
          }
          #nutrition-print-area .print-header {
            text-align: center; margin-bottom: 20px;
            border-bottom: 3px solid #10b981; padding-bottom: 10px;
          }
          #nutrition-print-area .print-title {
            font-size: 22px; font-weight: bold; color: #065f46; margin: 0 0 4px;
          }
          #nutrition-print-area .print-subtitle {
            font-size: 12px; color: #6b7280;
          }
          #nutrition-print-area .day-section {
            margin-bottom: 20px; page-break-inside: avoid;
          }
          #nutrition-print-area .day-header {
            background: #ecfdf5; color: #065f46; font-weight: bold;
            font-size: 13px; padding: 6px 10px; border-right: 4px solid #10b981;
            margin-bottom: 4px;
          }
          #nutrition-print-area table {
            width: 100%; border-collapse: collapse; font-size: 11px;
          }
          #nutrition-print-area th {
            background: #f9fafb; color: #374151; padding: 5px 8px;
            text-align: right; border-bottom: 2px solid #e5e7eb; font-weight: bold;
          }
          #nutrition-print-area .meal-row td {
            padding: 4px 8px; border-bottom: 1px solid #f3f4f6; text-align: right;
          }
          #nutrition-print-area .cal-cell  { color: #059669; font-weight: bold; }
          #nutrition-print-area .prot-cell { color: #2563eb; }
          #nutrition-print-area .carb-cell { color: #d97706; }
          #nutrition-print-area .fat-cell  { color: #7c3aed; }
          #nutrition-print-area .notes-cell { color: #9ca3af; font-style: italic; }
          #nutrition-print-area .day-total-row td {
            font-weight: bold; background: #f0fdf4;
            padding: 4px 8px; border-top: 1px solid #d1fae5; text-align: right;
          }
          #nutrition-print-area .grand-total {
            margin-top: 16px; background: #ecfdf5; border: 2px solid #10b981;
            padding: 10px 14px; display: flex; gap: 24px; justify-content: center; flex-wrap: wrap;
          }
          #nutrition-print-area .grand-total span { font-size: 12px; font-weight: bold; }
          #nutrition-print-area .print-footer {
            margin-top: 20px; border-top: 1px solid #e5e7eb;
            padding-top: 8px; font-size: 10px; color: #9ca3af; text-align: center;
          }
        }
      `;

      if (printRef.current) {
        printRef.current.innerHTML = `
          <div class="print-header">
            <div class="print-title">יומן תזונה — ${HEBREW_MONTHS[exportMonth]} ${exportYear}</div>
            <div class="print-subtitle">${userName ? `${userName} | ` : ""}${HEBREW_MONTHS[exportMonth]} ${exportYear}</div>
          </div>
          ${dayBlocks}
          <div class="grand-total">
            <span>סה&quot;כ חודשי:</span>
            <span class="cal-cell">קלוריות: ${Math.round(totRow.cal).toLocaleString("he-IL")}</span>
            <span class="prot-cell">חלבון: ${Math.round(totRow.prot)}g</span>
            <span class="carb-cell">פחמימות: ${Math.round(totRow.carb)}g</span>
            <span class="fat-cell">שומן: ${Math.round(totRow.fat)}g</span>
          </div>
          <div class="print-footer">הופק על ידי Life Dashboard | ${todayDisplay}</div>
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
