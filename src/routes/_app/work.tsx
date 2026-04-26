import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Briefcase, Play, Square, ChevronRight, Coffee, Plus, Clock,
  TrendingUp, Target, FileText, Calendar, Download, Umbrella,
  HeartPulse, Shield, Save, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  useAddShift, usePayrollSettings, useWorkShifts,
  useMonthlyPayslip, useSavePayrollSettings,
} from "@/hooks/use-work-data";
import {
  calcShiftBreakdown, calcMonthlyPayslip, SHIFT_HOURS, SHIFT_LABELS, SHIFT_TIMES,
  DEFAULT_PAYROLL_SETTINGS, type PayrollSettings, type ShiftRow,
} from "@/lib/payroll-engine";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/work")({
  component: WorkPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type WorkTab = "dashboard" | "finance" | "reports" | "settings";

interface LiveShiftState {
  type: string;
  startMs: number;
  isShabbat: boolean;
  noBreak: boolean;
  role: string;
}
interface ShiftCardDef {
  key: string; label: string; sublabel: string; emoji: string; image: string;
  type: string; isShabbat: boolean; color: string;
  bonusLabel: string | null; bonusAmount: number | null; hasBriefing: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS: { key: WorkTab; label: string }[] = [
  { key: "dashboard", label: "בית"   },
  { key: "finance",   label: "הבנק"  },
  { key: "reports",   label: "דוחות" },
  { key: "settings",  label: "חוזה"  },
];

const SHIFT_CARDS: ShiftCardDef[] = [
  { key: "morning",  label: "בוקר",       sublabel: "07:00 – 15:00", emoji: "🌅", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",  type: "morning",   isShabbat: false, color: "#f97316", bonusLabel: "+68₪ נסיעות",  bonusAmount: 68,   hasBriefing: false },
  { key: "evening",  label: "ערב / לילה", sublabel: "15:00 – 07:00", emoji: "🌙", image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80", type: "afternoon", isShabbat: false, color: "#6366f1", bonusLabel: null,           bonusAmount: null, hasBriefing: false },
  { key: "shabbat",  label: "שבת / חג",   sublabel: "שכר 150%",      emoji: "✨", image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600&q=80",  type: "morning",   isShabbat: true,  color: "#f59e0b", bonusLabel: "150% תעריף",   bonusAmount: null, hasBriefing: false },
  { key: "briefing", label: "רענון",       sublabel: "06:00 – 19:00", emoji: "📋", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80",  type: "briefing",  isShabbat: false, color: "#10b981", bonusLabel: "תוספת רענון", bonusAmount: null, hasBriefing: true  },
];

const MONTHS_HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const PIE_COLORS = ["#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt2   = (n: number) => String(n).padStart(2, "0");
const fmtNis = (n: number) => `₪${n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today  = () => new Date().toISOString().slice(0, 10);

// ─── ICS / Report helpers ─────────────────────────────────────────────────────
function generateICS(shifts: ShiftRow[], monthLabel: string): string {
  const fmtDt = (date: string, time: string, overnight = false) => {
    const d = new Date(date);
    if (overnight) d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10).replace(/-/g, "") + "T" + time.replace(":", "") + "00";
  };
  const esc = (s: string) => s.replace(/[,;\\]/g, "\\$&");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Life Dashboard//Shifts//HE", "CALSCALE:GREGORIAN"];
  for (const s of shifts) {
    const t = SHIFT_TIMES[s.type] ?? { start: "07:00", end: "15:00" };
    const overnight = t.end < t.start;
    lines.push(
      "BEGIN:VEVENT",
      `DTSTART:${fmtDt(s.date, t.start)}`,
      `DTEND:${fmtDt(s.date, t.end, overnight)}`,
      `SUMMARY:${esc(SHIFT_LABELS[s.type] ?? s.type)}${s.is_shabbat_holiday ? " (שבת)" : ""}`,
      s.notes ? `DESCRIPTION:${esc(s.notes)}` : "DESCRIPTION:",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportTextReport(shifts: ShiftRow[], settings: PayrollSettings, monthLabel: string) {
  const rows = shifts.map(s => {
    const bd    = calcShiftBreakdown(s, settings);
    const hours = s.hours ?? (SHIFT_HOURS[s.type] ?? 8);
    return `${s.date}  ${(SHIFT_LABELS[s.type] ?? s.type).padEnd(12)}  ${String(hours).padEnd(5)}ש׳  ${fmtNis(bd.totalGross)}`;
  });
  const total = shifts.reduce((sum, s) => sum + calcShiftBreakdown(s, settings).totalGross, 0);
  const content = [
    `דוח משמרות — ${monthLabel}`,
    `=`.repeat(48),
    `תאריך      סוג            שעות  ברוטו`,
    `-`.repeat(48),
    ...rows,
    `-`.repeat(48),
    `סה"כ: ${shifts.length} משמרות  |  ${fmtNis(total)} ברוטו`,
  ].join("\n");
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(`<html dir="rtl"><head><meta charset="utf-8"><title>דוח משמרות ${monthLabel}</title></head><body><pre style="font-family:monospace;font-size:14px;padding:24px">${content}</pre></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 1 — DASHBOARD sub-components
// ═══════════════════════════════════════════════════════════════════════

function LiveTracker({ live, settings, onStop }: { live: LiveShiftState; settings: PayrollSettings; onStop: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - live.startMs) / 1000)), 1000);
    return () => clearInterval(id);
  }, [live.startMs]);

  const hours  = elapsed / 3600;
  const effH   = live.noBreak ? hours : Math.max(0, hours - 0.5);
  const rate   = live.isShabbat ? settings.shabbat_hourly_rate : (live.role === "shift_manager" ? settings.alt_hourly_rate : settings.base_hourly_rate);
  const earned = effH * (rate + settings.recovery_per_hour + settings.excellence_per_hour);

  return (
    <div className="rounded-3xl border border-sky-500/30 bg-sky-500/8 backdrop-blur-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative h-3 w-3">
            <div className="absolute inset-0 rounded-full bg-sky-400 animate-ping opacity-75" />
            <div className="relative h-3 w-3 rounded-full bg-sky-400" />
          </div>
          <p className="text-sm font-black text-white">משמרת פעילה</p>
          <span className="text-[9px] text-white/40">{SHIFT_LABELS[live.type] ?? live.type}{live.isShabbat ? " · שבת" : ""}</span>
        </div>
        <button onClick={onStop} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-bold hover:bg-red-500/20 active:scale-95 transition-all">
          <Square className="h-3 w-3 fill-current" />סיים
        </button>
      </div>
      <div className="text-center py-2">
        <p className="text-5xl font-black text-white tracking-wider font-mono">{fmt2(Math.floor(elapsed/3600))}:{fmt2(Math.floor((elapsed%3600)/60))}:{fmt2(elapsed%60)}</p>
        <p className="text-[10px] text-white/35 mt-1.5">{live.noBreak ? "ללא הפסקה" : "כולל ניכוי 30 דק׳"}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-sky-500/10 border border-sky-500/15 p-3 text-center">
          <p className="text-[9px] text-white/40">צברת</p>
          <p className="text-xl font-black text-sky-300">{fmtNis(earned)}</p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/8 p-3 text-center">
          <p className="text-[9px] text-white/40">תעריף/שעה</p>
          <p className="text-xl font-black text-white">{fmtNis(rate)}</p>
        </div>
      </div>
    </div>
  );
}

function BreakToggle({ noBreak, onChange }: { noBreak: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!noBreak)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-xl transition-all duration-200 ${noBreak ? "border-sky-500/30 bg-sky-500/8" : "border-white/10 bg-white/5"}`}>
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${noBreak ? "bg-sky-500/20" : "bg-white/8"}`}>
        <Coffee className={`h-4 w-4 ${noBreak ? "text-sky-400" : "text-white/30"}`} />
      </div>
      <div className="flex-1 text-right">
        <p className="text-sm font-bold text-white">{noBreak ? "עבדתי רצוף — ללא הפסקה" : "עם הפסקה (30 דק׳ מנוכות)"}</p>
        <p className="text-[10px] text-white/35 mt-0.5">לחץ להחלפה בין מצבים</p>
      </div>
      <div className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200 ${noBreak ? "bg-sky-500" : "bg-white/15"}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${noBreak ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}

function ShiftCard({ card, noBreak, settings, onLog, onStart }: { card: ShiftCardDef; noBreak: boolean; settings: PayrollSettings; onLog: (c: ShiftCardDef) => void; onStart: (c: ShiftCardDef) => void }) {
  const baseH   = SHIFT_HOURS[card.type] ?? 8;
  const effH    = noBreak ? baseH : baseH - 0.5;
  const rate    = card.isShabbat ? settings.shabbat_hourly_rate : settings.base_hourly_rate;
  const gross   = effH * (rate + settings.recovery_per_hour + settings.excellence_per_hour) + settings.travel_per_shift + (card.hasBriefing ? settings.briefing_per_shift : 0) + (card.bonusAmount ?? 0);

  return (
    <div className="relative flex-shrink-0 w-40 h-52 rounded-3xl overflow-hidden"
      style={{ backgroundImage: `url('${card.image}')`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/20" />
      <div className="absolute inset-0 opacity-25" style={{ background: `radial-gradient(circle at top right, ${card.color}80, transparent 65%)` }} />
      <span className="absolute top-3 right-3 text-2xl drop-shadow-lg leading-none">{card.emoji}</span>
      {card.bonusLabel && (
        <div className="absolute top-3 left-2 px-2 py-0.5 rounded-lg text-[8px] font-black backdrop-blur-sm border" style={{ background: card.color + "28", borderColor: card.color + "50", color: card.color }}>{card.bonusLabel}</div>
      )}
      <p className="absolute bottom-[88px] left-0 right-0 px-3 text-base font-black text-white text-right leading-tight">{card.label}</p>
      <p className="absolute bottom-[75px] left-0 right-0 px-3 text-[9px] text-white/45 text-right">{card.sublabel}</p>
      <div className="absolute bottom-[50px] left-0 right-0 px-3">
        <p className="text-sm font-black text-right" style={{ color: card.color }}>{fmtNis(gross)}</p>
        <p className="text-[8px] text-white/30 text-right">{effH}ש׳ · ברוטו משוער</p>
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex gap-1.5">
        <button onClick={() => onStart(card)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-black text-white active:scale-95 transition-all" style={{ background: card.color + "cc", backdropFilter: "blur(8px)" }}>
          <Play className="h-2.5 w-2.5" />חי
        </button>
        <button onClick={() => onLog(card)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-black text-white/70 border border-white/15 bg-white/10 backdrop-blur-sm active:scale-95 transition-all">
          <Plus className="h-2.5 w-2.5" />רשום
        </button>
      </div>
    </div>
  );
}

function ShiftTicket({ shift, settings }: { shift: ShiftRow; settings: PayrollSettings }) {
  const bd    = calcShiftBreakdown(shift, settings);
  const hours = shift.hours ?? (SHIFT_HOURS[shift.type] ?? 8);
  const times = SHIFT_TIMES[shift.type] ?? { start: "—", end: "—" };
  const d     = new Date(shift.date);
  const accent = shift.is_shabbat_holiday ? "#f59e0b" : "#0ea5e9";

  return (
    <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-visible">
      <div className="absolute top-1/2 -translate-y-1/2 -right-3 h-6 w-6 rounded-full bg-[#080b12]" />
      <div className="absolute top-1/2 -translate-y-1/2 -left-3 h-6 w-6 rounded-full bg-[#080b12]" />
      <div className="flex items-stretch">
        <div className="flex flex-col items-center justify-center px-4 py-4 min-w-[76px] shrink-0" style={{ borderRight: "1px dashed rgba(255,255,255,0.08)" }}>
          <p className="text-[9px] text-white/30">{d.toLocaleDateString("he-IL", { weekday: "short" })}</p>
          <p className="text-2xl font-black text-white leading-none">{d.getDate()}</p>
          <p className="text-[9px] text-white/30">{MONTHS_HE[d.getMonth()].slice(0, 3)}</p>
          {shift.is_shabbat_holiday && <span className="mt-1.5 text-[8px] px-1.5 py-0.5 rounded-full font-black" style={{ background: "#f59e0b18", color: "#f59e0b" }}>שבת</span>}
        </div>
        <div className="flex-1 px-4 py-4 flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="text-sm font-black text-white">{SHIFT_LABELS[shift.type] ?? shift.type}</p>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold border shrink-0" style={{ borderColor: accent + "50", color: accent, background: accent + "12" }}>{shift.role === "shift_manager" ? "סמ" : "עובד"}</span>
            </div>
            <p className="text-[10px] text-white/40 flex items-center gap-1"><Clock className="h-2.5 w-2.5 shrink-0" />{times.start}–{times.end} · {hours}ש׳</p>
            {shift.notes && <p className="text-[9px] text-white/25 mt-0.5 truncate">{shift.notes}</p>}
          </div>
          <div className="text-left shrink-0">
            <p className="text-base font-black leading-none" style={{ color: accent }}>{fmtNis(bd.totalGross)}</p>
            <p className="text-[9px] text-white/30 text-left mt-0.5">ברוטו</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardTab({ liveShift, setLiveShift, noBreak, setNoBreak, settings, shifts }: {
  liveShift: LiveShiftState | null; setLiveShift: (s: LiveShiftState | null) => void;
  noBreak: boolean; setNoBreak: (v: boolean) => void;
  settings: PayrollSettings; shifts: ShiftRow[];
}) {
  const addShift = useAddShift();

  const handleLog = async (card: ShiftCardDef) => {
    const baseH = SHIFT_HOURS[card.type] ?? 8;
    const hours = noBreak ? baseH : baseH - 0.5;
    try {
      await addShift.mutateAsync({ date: today(), type: card.type, role: "caregiver", is_shabbat_holiday: card.isShabbat, has_briefing: card.hasBriefing, hours, notes: card.bonusAmount ? `נסיעות +${card.bonusAmount}₪` : null });
      const gross = calcShiftBreakdown({ id: "", date: today(), type: card.type, role: "caregiver", is_shabbat_holiday: card.isShabbat, has_briefing: card.hasBriefing, hours, notes: null }, settings).totalGross + (card.bonusAmount ?? 0);
      toast.success(`✅ ${card.label} נרשמה — ${fmtNis(gross)} ברוטו`);
    } catch { toast.error("שגיאה בשמירה"); }
  };

  const handleStart = (card: ShiftCardDef) => {
    if (liveShift) { toast.error("סיים את המשמרת הפעילה קודם"); return; }
    setLiveShift({ type: card.type, startMs: Date.now(), isShabbat: card.isShabbat, noBreak, role: "caregiver" });
    toast.success(`🟢 ${card.label} — מד זמן פעיל!`);
  };

  const handleStop = async () => {
    if (!liveShift) return;
    const elapsed = (Date.now() - liveShift.startMs) / 3600000;
    const hours   = parseFloat((liveShift.noBreak ? elapsed : Math.max(0, elapsed - 0.5)).toFixed(2));
    try {
      await addShift.mutateAsync({ date: today(), type: liveShift.type, role: liveShift.role, is_shabbat_holiday: liveShift.isShabbat, has_briefing: false, hours, notes: `משמרת חי — ${hours.toFixed(2)}ש׳` });
      toast.success(`✅ משמרת הסתיימה — ${hours.toFixed(1)}ש׳ נרשמו`);
    } catch { toast.error("שגיאה בשמירה"); }
    setLiveShift(null);
  };

  return (
    <div className="px-4 pt-4 space-y-5">
      {liveShift && <LiveTracker live={liveShift} settings={settings} onStop={handleStop} />}
      <BreakToggle noBreak={noBreak} onChange={setNoBreak} />
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-sm font-black text-white">הוסף משמרת</p>
          <button className="flex items-center gap-1 text-[11px] text-white/35"><span>כל הסוגים</span><ChevronRight className="h-3 w-3" /></button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-0.5 px-0.5" style={{ scrollSnapType: "x mandatory" }}>
          {SHIFT_CARDS.map((card) => (
            <div key={card.key} style={{ scrollSnapAlign: "start" }}>
              <ShiftCard card={card} noBreak={noBreak} settings={settings} onLog={handleLog} onStart={handleStart} />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-black text-white px-0.5">משמרות אחרונות</p>
        {shifts.length === 0 ? (
          <div className="rounded-3xl border border-white/8 bg-white/3 backdrop-blur-xl p-8 text-center">
            <Briefcase className="h-8 w-8 text-white/15 mx-auto mb-2" />
            <p className="text-xs text-white/30">אין משמרות — הוסף את הראשונה!</p>
          </div>
        ) : shifts.slice(0, 3).map((s) => <ShiftTicket key={s.id} shift={s} settings={settings} />)}
        {shifts.length > 3 && <p className="text-center text-[11px] text-sky-400/60 font-semibold">+ {shifts.length - 3} משמרות נוספות</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 2 — FINANCE / הבנק
// ═══════════════════════════════════════════════════════════════════════

function FinanceTab({ payslip, monthlyGoal, onGoalChange }: {
  payslip: ReturnType<typeof calcMonthlyPayslip> | null;
  monthlyGoal: number;
  onGoalChange: (v: number) => void;
}) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput]     = useState(String(monthlyGoal));

  if (!payslip) return (
    <div className="px-4 pt-20 text-center">
      <p className="text-white/30 text-sm">אין נתונים לחודש זה</p>
    </div>
  );

  // Ring chart data
  const pieData = [
    { name: "שכר בסיס",    value: Math.round(payslip.basePay + payslip.recovery + payslip.excellence) },
    { name: "שבת / חג",   value: Math.round(payslip.shabbatPay) },
    { name: "נסיעות",      value: Math.round(payslip.travel) },
    { name: "תוספות",      value: Math.round(payslip.briefingPay) },
  ].filter((d) => d.value > 0);

  const targetPct = Math.min(100, (payslip.totalGross / monthlyGoal) * 100);

  const deductionRows = [
    { label: "ביטוח לאומי",        icon: Shield,    val: payslip.nationalInsurance,  color: "#ef4444" },
    { label: "מס בריאות",          icon: HeartPulse, val: payslip.healthInsurance,    color: "#f97316" },
    { label: "הראל חיסכון (7%)",   icon: TrendingUp, val: payslip.harelSavings,      color: "#8b5cf6" },
    { label: "הראל לימודים (2.5%)",icon: TrendingUp, val: payslip.harelStudy,        color: "#8b5cf6" },
    { label: "הראל נסיעות (5%)",   icon: TrendingUp, val: payslip.harelTravel,       color: "#8b5cf6" },
    { label: "הראל נוסף (7%)",     icon: TrendingUp, val: payslip.extraHarel,        color: "#8b5cf6" },
  ].filter((r) => r.val > 0);

  return (
    <div className="px-4 pt-4 space-y-4">

      {/* Monthly target bar */}
      <div className="rounded-3xl border border-sky-500/20 bg-white/5 backdrop-blur-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-sky-400" />
            <p className="text-sm font-black text-white">יעד חודשי</p>
          </div>
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <input type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                className="w-24 bg-white/10 border border-white/15 rounded-xl px-2 py-1 text-sm text-white text-left outline-none focus:border-sky-500/50"
                dir="ltr" />
              <button onClick={() => { onGoalChange(Number(goalInput) || 10000); setEditingGoal(false); }}
                className="text-[10px] px-2.5 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold">שמור</button>
            </div>
          ) : (
            <button onClick={() => setEditingGoal(true)} className="text-[10px] text-white/35 hover:text-white/60 transition-colors font-semibold">{fmtNis(monthlyGoal)} ✏️</button>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${targetPct}%`, background: targetPct >= 100 ? "#10b981" : targetPct >= 70 ? "#0ea5e9" : "#f59e0b" }} />
          </div>
          <div className="flex justify-between text-[10px] text-white/40">
            <span>{fmtNis(payslip.totalGross)}</span>
            <span className={`font-black ${targetPct >= 100 ? "text-emerald-400" : "text-white/60"}`}>{targetPct.toFixed(0)}%</span>
            <span>{fmtNis(monthlyGoal)}</span>
          </div>
        </div>
      </div>

      {/* Income ring chart */}
      {pieData.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
          <p className="text-sm font-black text-white">פירוט הכנסות</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 11 }}
                formatter={(v: number) => [fmtNis(v), ""]}
              />
              <Legend formatter={(v) => <span className="text-[10px] text-white/60">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="rounded-2xl border border-white/8 bg-white/4 p-2.5 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <div className="min-w-0">
                  <p className="text-[9px] text-white/40 truncate">{d.name}</p>
                  <p className="text-xs font-black text-white">{fmtNis(d.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Net-to-Bank predictor */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
        <p className="text-sm font-black text-white">מניין לבנק 🏦</p>

        {/* Gross */}
        <div className="flex justify-between items-center py-2 border-b border-white/8">
          <span className="text-xs font-semibold text-white/70">ברוטו</span>
          <span className="text-base font-black text-white">{fmtNis(payslip.totalGross)}</span>
        </div>

        {/* Deductions */}
        <div className="space-y-2">
          {deductionRows.map(({ label, icon: Icon, val, color }) => (
            <div key={label} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icon className="h-3 w-3 shrink-0" style={{ color }} />
                <span className="text-[11px] text-white/55">{label}</span>
              </div>
              <span className="text-[11px] font-semibold text-red-400">-{fmtNis(val)}</span>
            </div>
          ))}
          {payslip.lunchDeduction > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-white/55">ניכוי צהריים</span>
              <span className="text-[11px] font-semibold text-red-400">-{fmtNis(payslip.lunchDeduction)}</span>
            </div>
          )}
        </div>

        {/* Net result */}
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-3 flex justify-between items-center">
          <span className="text-sm font-black text-white">נטו לבנק 💳</span>
          <span className="text-xl font-black text-emerald-400">{fmtNis(payslip.netPay)}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["ניכויים חובה", payslip.totalMandatory, "#ef4444"],
            ["פנסיה/חיסכון", payslip.totalPension,   "#8b5cf6"],
            ["סה״כ ניכויים", payslip.totalDeductions, "#f97316"],
          ].map(([label, val, color]) => (
            <div key={String(label)} className="rounded-xl border border-white/8 bg-white/4 p-2">
              <p className="text-[8px] text-white/35">{label}</p>
              <p className="text-xs font-black" style={{ color: String(color) }}>{fmtNis(Number(val))}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 3 — REPORTS & RIGHTS
// ═══════════════════════════════════════════════════════════════════════

function ReportsTab({ shifts, settings, monthLabel }: { shifts: ShiftRow[]; settings: PayrollSettings; monthLabel: string }) {
  const payslip = calcMonthlyPayslip(shifts, settings);

  // Israeli labor law accumulation (per month worked)
  const VACATION_PER_MONTH = 10 / 12;   // 10 days/year standard
  const SICK_PER_MONTH     = 1.5;        // 1.5 days/month
  const vacAccrued   = parseFloat(VACATION_PER_MONTH.toFixed(2));
  const sickAccrued  = SICK_PER_MONTH;
  const totalHoursYTD = payslip.totalHours; // just this month for now

  const handleICS = () => {
    if (shifts.length === 0) { toast.error("אין משמרות לייצוא"); return; }
    const ics = generateICS(shifts, monthLabel);
    downloadBlob(ics, `משמרות-${monthLabel}.ics`, "text/calendar;charset=utf-8");
    toast.success("קובץ .ics הורד — פתח ביומן Google/Apple");
  };

  const handleReport = () => {
    if (shifts.length === 0) { toast.error("אין משמרות לייצוא"); return; }
    exportTextReport(shifts, settings, monthLabel);
  };

  const handleCSV = () => {
    if (shifts.length === 0) { toast.error("אין משמרות לייצוא"); return; }
    const header = "תאריך,סוג,שעות,ברוטו,שבת";
    const rows   = shifts.map(s => {
      const bd    = calcShiftBreakdown(s, settings);
      const hours = s.hours ?? (SHIFT_HOURS[s.type] ?? 8);
      return [s.date, SHIFT_LABELS[s.type] ?? s.type, hours, bd.totalGross.toFixed(2), s.is_shabbat_holiday ? "כן" : "לא"].join(",");
    });
    downloadBlob([header, ...rows].join("\n"), `משמרות-${monthLabel}.csv`, "text/csv;charset=utf-8");
    toast.success("קובץ CSV הורד");
  };

  const rights = [
    { label: "ימי חופשה שנצברו (החודש)",  icon: Umbrella, val: `${vacAccrued.toFixed(2)} ימים`, color: "#0ea5e9", desc: "לפי 10 ימים/שנה (חוק)" },
    { label: "ימי מחלה שנצברו (החודש)",    icon: HeartPulse, val: `${sickAccrued} ימים`,         color: "#10b981", desc: "1.5 ימים/חודש עבודה" },
    { label: "שעות חודש זה",               icon: Clock,     val: `${payslip.totalHours}ש׳`,      color: "#f59e0b", desc: `${payslip.totalShifts} משמרות` },
    { label: "שעות שבת / חג",              icon: Calendar,  val: `${payslip.shabbatHours}ש׳`,    color: "#f97316", desc: "ב-150% תעריף" },
  ];

  return (
    <div className="px-4 pt-4 space-y-4">

      {/* Rights accumulator */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
        <p className="text-sm font-black text-white">זכויות שנצברו ⚖️</p>
        <div className="grid grid-cols-2 gap-2">
          {rights.map(({ label, icon: Icon, val, color, desc }) => (
            <div key={label} className="rounded-2xl border border-white/8 bg-white/4 p-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                <p className="text-[9px] text-white/40 leading-tight">{label}</p>
              </div>
              <p className="text-base font-black text-white">{val}</p>
              <p className="text-[8px] text-white/30">{desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-3">
          <p className="text-[10px] text-amber-300/80 leading-relaxed">⚠️ הנתונים מבוססים על חודש זה בלבד. לחישוב מדויק לפי תקופת עבודה מלאה — פנה למחלקת כוח אדם.</p>
        </div>
      </div>

      {/* Export buttons */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
        <p className="text-sm font-black text-white">ייצוא דוחות 📤</p>
        <div className="space-y-2.5">
          <button onClick={handleReport}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-sky-500/20 bg-sky-500/8 hover:bg-sky-500/12 active:scale-[0.98] transition-all">
            <div className="h-9 w-9 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0"><FileText className="h-4 w-4 text-sky-400" /></div>
            <div className="flex-1 text-right">
              <p className="text-sm font-bold text-white">הדפסת דוח PDF</p>
              <p className="text-[10px] text-white/35">פותח חלון הדפסה עם כל המשמרות</p>
            </div>
            <Download className="h-4 w-4 text-sky-400/60 shrink-0" />
          </button>

          <button onClick={handleCSV}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 hover:bg-emerald-500/12 active:scale-[0.98] transition-all">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0"><Download className="h-4 w-4 text-emerald-400" /></div>
            <div className="flex-1 text-right">
              <p className="text-sm font-bold text-white">ייצוא Excel / CSV</p>
              <p className="text-[10px] text-white/35">קובץ גיליון עם כל המשמרות</p>
            </div>
            <Download className="h-4 w-4 text-emerald-400/60 shrink-0" />
          </button>

          <button onClick={handleICS}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-violet-500/20 bg-violet-500/8 hover:bg-violet-500/12 active:scale-[0.98] transition-all">
            <div className="h-9 w-9 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0"><Calendar className="h-4 w-4 text-violet-400" /></div>
            <div className="flex-1 text-right">
              <p className="text-sm font-bold text-white">סנכרון יומן (.ics)</p>
              <p className="text-[10px] text-white/35">Google Calendar / Apple Calendar</p>
            </div>
            <Download className="h-4 w-4 text-violet-400/60 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 4 — CONTRACT SETTINGS
// ═══════════════════════════════════════════════════════════════════════

function SettingsTab({ settings }: { settings: PayrollSettings }) {
  const saveSettings = useSavePayrollSettings();
  const [vals, setVals] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const set = (k: keyof PayrollSettings, v: string) =>
    setVals((prev) => ({ ...prev, [k]: k === "income_sync_mode" ? v : Number(v) }));

  const handleSave = async () => {
    try {
      await saveSettings.mutateAsync(vals);
      setSaved(true);
      toast.success("הגדרות נשמרו ✅");
      setTimeout(() => setSaved(false), 3000);
    } catch { toast.error("שגיאה בשמירה"); }
  };

  const Field = ({ label, field, suffix = "₪", step = "0.01" }: { label: string; field: keyof PayrollSettings; suffix?: string; step?: string }) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-white/40">{label}</label>
      <div className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-xl px-3 py-2 focus-within:border-sky-500/40">
        <input type="number" step={step} value={Number(vals[field])} onChange={(e) => set(field, e.target.value)}
          className="flex-1 bg-transparent text-sm text-white outline-none text-left" dir="ltr" />
        <span className="text-[10px] text-white/30 shrink-0">{suffix}</span>
      </div>
    </div>
  );

  return (
    <div className="px-4 pt-4 space-y-4 pb-8">

      {/* Rates */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
        <p className="text-sm font-black text-white">תעריפים שעתיים 💰</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="שכר בסיס/שעה"     field="base_hourly_rate"    />
          <Field label="שכר חלופי/שעה"    field="alt_hourly_rate"     />
          <Field label="שכר שבת/שעה (150%)" field="shabbat_hourly_rate" />
          <Field label="שיקום/שעה"        field="recovery_per_hour"   />
          <Field label="מצוינות/שעה"      field="excellence_per_hour" />
        </div>
      </div>

      {/* Allowances */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
        <p className="text-sm font-black text-white">תוספות למשמרת</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="נסיעות/משמרת"   field="travel_per_shift"   />
          <Field label="רענון/משמרת"    field="briefing_per_shift" />
          <Field label="ניכוי צהריים"   field="lunch_deduction"    />
          <Field label="איגוד לאומי"    field="union_national_deduction" />
        </div>
      </div>

      {/* Deductions % */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
        <p className="text-sm font-black text-white">ניכויים (%)</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ביטוח לאומי %"     field="national_insurance_pct"  suffix="%" step="0.01" />
          <Field label="מס בריאות %"        field="health_insurance_pct"    suffix="%" step="0.01" />
          <Field label="הראל חיסכון %"      field="harel_savings_pct"       suffix="%" step="0.01" />
          <Field label="הראל לימודים %"     field="harel_study_pct"         suffix="%" step="0.01" />
          <Field label="הראל נסיעות %"      field="harel_travel_pct"        suffix="%" step="0.01" />
          <Field label="הראל נוסף %"        field="extra_harel_pct"         suffix="%" step="0.01" />
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saveSettings.isPending}
        className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-3xl font-black text-sm transition-all active:scale-[0.98] ${
          saved ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                : "bg-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.35)] hover:bg-sky-400"}`}>
        {saveSettings.isPending ? "שומר..." : saved ? "✅ נשמר!" : <><Save className="h-4 w-4" />שמור הגדרות</>}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════
function WorkPage() {
  const [activeTab, setActiveTab] = useState<WorkTab>("dashboard");
  const [noBreak,   setNoBreak]   = useState(false);
  const [liveShift, setLiveShift] = useState<LiveShiftState | null>(null);
  const [monthlyGoal, setMonthlyGoal] = useState(() => Number(localStorage.getItem("work_monthly_goal") || "10000"));

  const updateGoal = useCallback((v: number) => {
    setMonthlyGoal(v);
    localStorage.setItem("work_monthly_goal", String(v));
  }, []);

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: settings }     = usePayrollSettings();
  const { data: shifts }       = useWorkShifts(year, month);

  const resolvedSettings = settings ?? DEFAULT_PAYROLL_SETTINGS;
  const resolvedShifts   = (shifts ?? []) as ShiftRow[];

  const monthLabel  = `${MONTHS_HE[month - 1]} ${year}`;
  const payslip     = calcMonthlyPayslip(resolvedShifts, resolvedSettings);
  const totalEarned = payslip.totalGross;

  return (
    <>
      <div
        dir="rtl"
        className="-mx-3 md:-mx-6 -mt-3 md:-mt-6 relative bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2000&auto=format&fit=crop')`,
          minHeight: "100vh",
        }}
      >
        <div className="absolute inset-0 bg-[#080b12]/85 pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sky-500/12 blur-[140px]" />
          <div className="absolute bottom-40 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10 pb-32">
          {/* Header */}
          <div className="px-4 pt-5 pb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-sky-500/20 backdrop-blur-md border border-sky-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.25)]">
                <Briefcase className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">עבודה 💼</h1>
                <p className="text-[11px] text-white/40 mt-0.5">{monthLabel} · {resolvedShifts.length} משמרות</p>
              </div>
            </div>
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/8 backdrop-blur-xl px-3 py-2 text-center shrink-0">
              <p className="text-[9px] text-white/35 font-medium">ברוטו חודש</p>
              <p className="text-sm font-black text-sky-300">{fmtNis(totalEarned)}</p>
            </div>
          </div>

          {/* Live banner (compact, on non-dashboard tabs) */}
          {liveShift && activeTab !== "dashboard" && (
            <div className="mx-4 mb-2 rounded-2xl border border-sky-500/25 bg-sky-500/8 backdrop-blur-xl px-4 py-2.5 flex items-center gap-3">
              <div className="relative h-2 w-2 shrink-0">
                <div className="absolute inset-0 rounded-full bg-sky-400 animate-ping opacity-75" />
                <div className="relative h-2 w-2 rounded-full bg-sky-400" />
              </div>
              <p className="text-xs font-bold text-sky-300 flex-1">{SHIFT_LABELS[liveShift.type] ?? liveShift.type} פעילה</p>
              <button onClick={() => setActiveTab("dashboard")} className="text-[10px] text-sky-400 font-bold">← בית</button>
            </div>
          )}

          {/* Sticky Tab Bar */}
          <div className="sticky top-0 z-20 px-4 py-2 bg-black/60 backdrop-blur-xl">
            <div className="flex gap-1 p-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                    activeTab === t.key ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30" : "text-white/40 hover:text-white/70"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === "dashboard" && (
            <DashboardTab liveShift={liveShift} setLiveShift={setLiveShift} noBreak={noBreak} setNoBreak={setNoBreak} settings={resolvedSettings} shifts={resolvedShifts} />
          )}
          {activeTab === "finance" && (
            <FinanceTab payslip={payslip} monthlyGoal={monthlyGoal} onGoalChange={updateGoal} />
          )}
          {activeTab === "reports" && (
            <ReportsTab shifts={resolvedShifts} settings={resolvedSettings} monthLabel={monthLabel} />
          )}
          {activeTab === "settings" && (
            <SettingsTab settings={resolvedSettings} />
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
