import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Briefcase, Play, Square, Coffee, Plus, Clock,
  TrendingUp, Target, FileText, Calendar, Download,
  HeartPulse, Shield, Save, ChevronDown, ChevronUp,
  Wallet, BarChart2, Zap,
} from "lucide-react";
import {
  useAddShift, usePayrollSettings, useWorkShifts,
  useSavePayrollSettings,
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

const SHIFT_TYPE_COLORS: Record<string, string> = {
  morning: "#f97316",
  afternoon: "#6366f1",
  night: "#6366f1",
  briefing: "#10b981",
};

const MONTHS_HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const PIE_COLORS = ["#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6", "#f97316"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt2   = (n: number) => String(n).padStart(2, "0");
const fmtNis = (n: number) => `₪${n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today  = () => new Date().toISOString().slice(0, 10);
const hasCoupon = (s: ShiftRow) => !!(s.notes?.includes("נסיעות +"));

// ─── ICS / Export helpers ─────────────────────────────────────────────────────
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

function exportCSV(shifts: ShiftRow[], settings: PayrollSettings, monthLabel: string) {
  const header = "תאריך,סוג,שעות,ברוטו,שבת,קופון";
  const rows = shifts.map(s => {
    const bd    = calcShiftBreakdown(s, settings);
    const hours = s.hours ?? (SHIFT_HOURS[s.type] ?? 8);
    return [s.date, SHIFT_LABELS[s.type] ?? s.type, hours, bd.totalGross.toFixed(2), s.is_shabbat_holiday ? "כן" : "לא", hasCoupon(s) ? "68" : "0"].join(",");
  });
  downloadBlob([header, ...rows].join("\n"), `משמרות-${monthLabel}.csv`, "text/csv;charset=utf-8");
  toast.success("קובץ CSV הורד");
}

function exportPayslipReport(
  payslip: ReturnType<typeof calcMonthlyPayslip>,
  shifts: ShiftRow[],
  settings: PayrollSettings,
  monthLabel: string,
  couponTotal: number
) {
  const rows = shifts.map(s => {
    const bd    = calcShiftBreakdown(s, settings);
    const hours = s.hours ?? (SHIFT_HOURS[s.type] ?? 8);
    const coupon = hasCoupon(s) ? 68 : 0;
    return `<tr>
      <td>${s.date}</td>
      <td>${SHIFT_LABELS[s.type] ?? s.type}${s.is_shabbat_holiday ? " (שבת)" : ""}</td>
      <td>${hours}ש׳</td>
      <td>${fmtNis(bd.totalGross)}</td>
      <td>${coupon > 0 ? fmtNis(coupon) : "—"}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8">
<title>תלוש שכר — ${monthLabel}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0c10; color: #e2e8f0; padding: 32px; margin: 0; }
  h1 { font-size: 28px; font-weight: 900; color: #38bdf8; margin: 0 0 4px; }
  .sub { font-size: 13px; color: #64748b; margin-bottom: 24px; }
  .section { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
  .section h2 { font-size: 12px; font-weight: 700; color: #64748b; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.06em; }
  .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
  .row:last-child { border-bottom: none; }
  .label { color: #94a3b8; }
  .val { font-weight: 700; }
  .red { color: #f87171; }
  .green { color: #4ade80; }
  .blue { color: #38bdf8; }
  .gross { font-size: 20px; font-weight: 900; color: #38bdf8; }
  .net  { font-size: 32px; font-weight: 900; color: #4ade80; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: right; padding: 8px 4px; border-bottom: 1px solid rgba(255,255,255,0.1); color: #64748b; font-size: 11px; }
  td { padding: 8px 4px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <h1>💼 תלוש שכר</h1>
  <div class="sub">${monthLabel} · ${payslip.totalShifts} משמרות · ${payslip.totalHours}ש׳ סה"כ</div>

  <div class="section">
    <h2>הכנסות</h2>
    <div class="row"><span class="label">שכר בסיס</span><span class="val">${fmtNis(payslip.basePay)}</span></div>
    <div class="row"><span class="label">שיקום</span><span class="val">${fmtNis(payslip.recovery)}</span></div>
    <div class="row"><span class="label">מצוינות</span><span class="val">${fmtNis(payslip.excellence)}</span></div>
    ${payslip.shabbatPay > 0 ? `<div class="row"><span class="label">שבת / חג (150%)</span><span class="val">${fmtNis(payslip.shabbatPay)}</span></div>` : ""}
    <div class="row"><span class="label">נסיעות (${payslip.travelCount} משמרות)</span><span class="val">${fmtNis(payslip.travel)}</span></div>
    ${payslip.briefingPay > 0 ? `<div class="row"><span class="label">רענון</span><span class="val">${fmtNis(payslip.briefingPay)}</span></div>` : ""}
    ${couponTotal > 0 ? `<div class="row"><span class="label">קופון נסיעות (הכנסה נוספת)</span><span class="val blue">+${fmtNis(couponTotal)}</span></div>` : ""}
    <div class="row" style="margin-top:8px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.15)">
      <span class="label" style="font-weight:700;color:#e2e8f0">ברוטו כולל</span>
      <span class="gross">${fmtNis(payslip.totalGross + couponTotal)}</span>
    </div>
  </div>

  <div class="section">
    <h2>ניכויים</h2>
    <div class="row"><span class="label">ביטוח לאומי</span><span class="val red">-${fmtNis(payslip.nationalInsurance)}</span></div>
    <div class="row"><span class="label">מס בריאות</span><span class="val red">-${fmtNis(payslip.healthInsurance)}</span></div>
    <div class="row"><span class="label">הראל חיסכון (7%)</span><span class="val red">-${fmtNis(payslip.harelSavings)}</span></div>
    <div class="row"><span class="label">הראל לימודים (2.5%)</span><span class="val red">-${fmtNis(payslip.harelStudy)}</span></div>
    <div class="row"><span class="label">הראל נסיעות (5%)</span><span class="val red">-${fmtNis(payslip.harelTravel)}</span></div>
    <div class="row"><span class="label">הראל נוסף (7%)</span><span class="val red">-${fmtNis(payslip.extraHarel)}</span></div>
    ${payslip.lunchDeduction > 0 ? `<div class="row"><span class="label">ניכוי צהריים</span><span class="val red">-${fmtNis(payslip.lunchDeduction)}</span></div>` : ""}
    <div class="row" style="margin-top:8px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.15)">
      <span class="label" style="font-weight:700;color:#e2e8f0">סה"כ ניכויים</span>
      <span class="val red">-${fmtNis(payslip.totalDeductions)}</span>
    </div>
  </div>

  <div class="section" style="text-align:center;padding:32px">
    <div style="font-size:13px;color:#64748b;margin-bottom:6px">נטו לבנק 💳</div>
    <div class="net">${fmtNis(payslip.netPay + couponTotal)}</div>
  </div>

  <div class="section">
    <h2>פירוט משמרות</h2>
    <table>
      <thead><tr><th>תאריך</th><th>סוג</th><th>שעות</th><th>ברוטו</th><th>קופון</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <script>setTimeout(() => window.print(), 300);</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

// ═══════════════════════════════════════════════════════════════════════
//  LIVE TRACKER
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
        <p className="text-5xl font-black text-white tracking-wider font-mono">
          {fmt2(Math.floor(elapsed/3600))}:{fmt2(Math.floor((elapsed%3600)/60))}:{fmt2(elapsed%60)}
        </p>
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

// ─── Shift Card (image-backed quick-add) ──────────────────────────────────────
function ShiftCard({ card, noBreak, settings, onLog, onStart }: {
  card: ShiftCardDef; noBreak: boolean; settings: PayrollSettings;
  onLog: (c: ShiftCardDef) => void; onStart: (c: ShiftCardDef) => void;
}) {
  const baseH = SHIFT_HOURS[card.type] ?? 8;
  const effH  = noBreak ? baseH : baseH - 0.5;
  const rate  = card.isShabbat ? settings.shabbat_hourly_rate : settings.base_hourly_rate;
  // FIX 2: gross does NOT include bonusAmount (coupon)
  const gross = effH * (rate + settings.recovery_per_hour + settings.excellence_per_hour)
    + settings.travel_per_shift
    + (card.hasBriefing ? settings.briefing_per_shift : 0);

  return (
    <div className="relative flex-shrink-0 w-40 h-52 rounded-3xl overflow-hidden"
      style={{ backgroundImage: `url('${card.image}')`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/20" />
      <div className="absolute inset-0 opacity-25" style={{ background: `radial-gradient(circle at top right, ${card.color}80, transparent 65%)` }} />
      {/* N99-inspired colored top strip */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${card.color}, ${card.color}50)` }} />

      <span className="absolute top-4 right-3 text-2xl drop-shadow-lg leading-none">{card.emoji}</span>
      {card.bonusLabel && (
        <div className="absolute top-3 left-2 px-2 py-0.5 rounded-lg text-[8px] font-black backdrop-blur-sm border"
          style={{ background: card.color + "28", borderColor: card.color + "50", color: card.color }}>
          {card.bonusLabel}
        </div>
      )}
      <p className="absolute bottom-[88px] left-0 right-0 px-3 text-base font-black text-white text-right leading-tight">{card.label}</p>
      <p className="absolute bottom-[75px] left-0 right-0 px-3 text-[9px] text-white/45 text-right">{card.sublabel}</p>
      <div className="absolute bottom-[50px] left-0 right-0 px-3">
        <p className="text-sm font-black text-right" style={{ color: card.color }}>{fmtNis(gross)}</p>
        <p className="text-[8px] text-white/30 text-right">{effH}ש׳ · ברוטו משוער</p>
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex gap-1.5">
        <button onClick={() => onStart(card)}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-black text-white active:scale-95 transition-all"
          style={{ background: card.color + "cc", backdropFilter: "blur(8px)" }}>
          <Play className="h-2.5 w-2.5" />חי
        </button>
        {/* FIX 1: "רשום" → "הוסף" */}
        <button onClick={() => onLog(card)}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-black text-white/70 border border-white/15 bg-white/10 backdrop-blur-sm active:scale-95 transition-all">
          <Plus className="h-2.5 w-2.5" />הוסף
        </button>
      </div>
    </div>
  );
}

// ─── N99-inspired premium ShiftTicket ────────────────────────────────────────
function ShiftTicket({ shift, settings }: { shift: ShiftRow; settings: PayrollSettings }) {
  const bd    = calcShiftBreakdown(shift, settings);
  const hours = shift.hours ?? (SHIFT_HOURS[shift.type] ?? 8);
  const times = SHIFT_TIMES[shift.type] ?? { start: "—", end: "—" };
  const d     = new Date(shift.date);
  const accent = shift.is_shabbat_holiday ? "#f59e0b" : (SHIFT_TYPE_COLORS[shift.type] ?? "#0ea5e9");
  const coupon = hasCoupon(shift) ? 68 : 0;

  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/8 bg-white/[0.04] backdrop-blur-xl">
      {/* N99-style colored top accent strip */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}30)` }} />

      <div className="flex items-stretch">
        {/* Date column */}
        <div className="flex flex-col items-center justify-center px-4 py-4 min-w-[72px] shrink-0"
          style={{ borderRight: "1px dashed rgba(255,255,255,0.08)" }}>
          <p className="text-[8px] font-semibold uppercase tracking-wider opacity-60" style={{ color: accent }}>
            {d.toLocaleDateString("he-IL", { weekday: "short" })}
          </p>
          <p className="text-3xl font-black text-white leading-none mt-0.5">{d.getDate()}</p>
          <p className="text-[9px] text-white/35 mt-0.5">{MONTHS_HE[d.getMonth()].slice(0, 3)}</p>
          {shift.is_shabbat_holiday && (
            <span className="mt-1.5 text-[7px] px-1.5 py-0.5 rounded-full font-black"
              style={{ background: "#f59e0b18", color: "#f59e0b" }}>שבת</span>
          )}
        </div>

        {/* Punch-out circle */}
        <div className="relative w-0 overflow-visible flex items-center">
          <div className="absolute -translate-x-1/2 h-5 w-5 rounded-full bg-[#080b12]" />
        </div>

        {/* Shift details */}
        <div className="flex-1 px-4 py-4 flex flex-col justify-between gap-2 min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-black text-white">{SHIFT_LABELS[shift.type] ?? shift.type}</p>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold border shrink-0"
                style={{ borderColor: accent + "50", color: accent, background: accent + "12" }}>
                {shift.role === "shift_manager" ? "סמ" : "עובד"}
              </span>
            </div>
            <p className="text-[10px] text-white/40 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 shrink-0" />
              {times.start}–{times.end} · {hours}ש׳
            </p>
            {coupon > 0 && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-[8px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: "#f9731614", color: "#f97316", border: "1px solid #f9731630" }}>
                +₪68 נסיעות
              </span>
            )}
          </div>
          {/* N99-style large amount at bottom */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-black leading-none" style={{ color: accent }}>
                {fmtNis(bd.totalGross)}
              </p>
              <p className="text-[9px] text-white/25 mt-0.5">ברוטו</p>
            </div>
            {coupon > 0 && (
              <p className="text-[10px] font-bold text-orange-400 opacity-70">+{fmtNis(coupon)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Adverse-inspired stats strip ────────────────────────────────────────────
function StatsStrip({ shifts, settings }: { shifts: ShiftRow[]; settings: PayrollSettings }) {
  const payslip    = calcMonthlyPayslip(shifts, settings);
  const couponTotal = shifts.filter(hasCoupon).length * 68;

  const stats = [
    { value: String(payslip.totalShifts), label: "משמרות" },
    { value: String(payslip.totalHours),  label: "שעות" },
    { value: fmtNis(payslip.totalGross + couponTotal), label: "ברוטו", accent: true },
  ];

  return (
    <div className="mx-4 rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl px-2 py-3">
      <div className="flex items-center justify-around">
        {stats.map((s, i) => (
          <>
            {i > 0 && <div key={`div-${i}`} className="w-px h-8 bg-white/10" />}
            <div key={s.label} className="text-center px-2">
              <p className={`text-2xl font-black leading-none ${s.accent ? "text-sky-300" : "text-white"}`}>{s.value}</p>
              <p className="text-[9px] text-white/35 mt-1 font-semibold">{s.label}</p>
            </div>
          </>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 1 — DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
function DashboardTab({ liveShift, setLiveShift, noBreak, setNoBreak, settings, shifts }: {
  liveShift: LiveShiftState | null; setLiveShift: (s: LiveShiftState | null) => void;
  noBreak: boolean; setNoBreak: (v: boolean) => void;
  settings: PayrollSettings; shifts: ShiftRow[];
}) {
  const addShift = useAddShift();
  const [showAll, setShowAll] = useState(false);

  // FIX 1 + FIX 2: Proper error handling, gross without coupon amount
  const handleLog = async (card: ShiftCardDef) => {
    const baseH = SHIFT_HOURS[card.type] ?? 8;
    const hours = noBreak ? baseH : baseH - 0.5;
    const payload = {
      date: today(),
      type: card.type,
      role: "caregiver",
      is_shabbat_holiday: card.isShabbat,
      has_briefing: card.hasBriefing,
      hours,
      notes: card.bonusAmount ? `נסיעות +${card.bonusAmount}₪` : null,
    };
    try {
      await addShift.mutateAsync(payload);
      const gross = calcShiftBreakdown(
        { id: "", date: today(), type: card.type, role: "caregiver",
          is_shabbat_holiday: card.isShabbat, has_briefing: card.hasBriefing,
          hours, notes: null },
        settings
      ).totalGross;
      const bonusNote = card.bonusAmount ? ` + ₪${card.bonusAmount} נסיעות` : "";
      toast.success(`✅ ${card.label} נרשמה — ${fmtNis(gross)} ברוטו${bonusNote}`);
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "שגיאה לא ידועה";
      toast.error(`שגיאה בשמירה: ${msg}`);
      console.error("[handleLog]", err);
    }
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
      await addShift.mutateAsync({
        date: today(), type: liveShift.type, role: liveShift.role,
        is_shabbat_holiday: liveShift.isShabbat, has_briefing: false,
        hours, notes: `משמרת חי — ${hours.toFixed(2)}ש׳`,
      });
      toast.success(`✅ משמרת הסתיימה — ${hours.toFixed(1)}ש׳ נרשמו`);
    } catch (err: unknown) {
      toast.error(`שגיאה בשמירה: ${(err as Error)?.message ?? ""}`);
    }
    setLiveShift(null);
  };

  const displayedShifts = showAll ? shifts : shifts.slice(0, 3);

  return (
    <div className="pt-3 space-y-4">
      {/* Adverse-style stats strip (only if there are shifts) */}
      {shifts.length > 0 && <StatsStrip shifts={shifts} settings={settings} />}

      <div className="px-4 space-y-4">
        {liveShift && <LiveTracker live={liveShift} settings={settings} onStop={handleStop} />}
        <BreakToggle noBreak={noBreak} onChange={setNoBreak} />

        {/* Quick-add shift cards */}
        <div className="space-y-2">
          <p className="text-sm font-black text-white px-0.5">הוסף משמרת</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-0.5 px-0.5"
            style={{ scrollSnapType: "x mandatory" }}>
            {SHIFT_CARDS.map((card) => (
              <div key={card.key} style={{ scrollSnapAlign: "start" }}>
                <ShiftCard card={card} noBreak={noBreak} settings={settings} onLog={handleLog} onStart={handleStart} />
              </div>
            ))}
          </div>
        </div>

        {/* FIX 3: Full shift history */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-sm font-black text-white">משמרות החודש</p>
            {shifts.length > 3 && (
              <button onClick={() => setShowAll(v => !v)}
                className="flex items-center gap-1 text-[11px] text-sky-400 font-semibold">
                {showAll
                  ? <><ChevronUp className="h-3 w-3" />הסתר</>
                  : <><ChevronDown className="h-3 w-3" />הכל ({shifts.length})</>}
              </button>
            )}
          </div>

          {shifts.length === 0 ? (
            <div className="rounded-3xl border border-white/8 bg-white/3 backdrop-blur-xl p-8 text-center">
              <Briefcase className="h-8 w-8 text-white/15 mx-auto mb-2" />
              <p className="text-xs text-white/30">אין משמרות — הוסף את הראשונה!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedShifts.map((s) => <ShiftTicket key={s.id} shift={s} settings={settings} />)}
            </div>
          )}

          {shifts.length > 3 && !showAll && (
            <button onClick={() => setShowAll(true)}
              className="w-full py-2.5 rounded-2xl border border-white/8 bg-white/4 text-[11px] text-sky-400/70 font-semibold hover:bg-white/6 transition-all">
              + {shifts.length - 3} משמרות נוספות
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 2 — FINANCE
// ═══════════════════════════════════════════════════════════════════════
function FinanceTab({ payslip, shifts, monthlyGoal, onGoalChange }: {
  payslip: ReturnType<typeof calcMonthlyPayslip>;
  shifts: ShiftRow[];
  monthlyGoal: number;
  onGoalChange: (v: number) => void;
}) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput]     = useState(String(monthlyGoal));

  // FIX 2: coupon income is separate from shift gross
  const couponCount     = shifts.filter(hasCoupon).length;
  const couponTotal     = couponCount * 68;
  const totalWithCoupon = payslip.totalGross + couponTotal;
  const targetPct       = Math.min(100, (totalWithCoupon / monthlyGoal) * 100);

  const pieData = [
    { name: "שכר בסיס",      value: Math.round(payslip.basePay + payslip.recovery + payslip.excellence) },
    { name: "שבת / חג",      value: Math.round(payslip.shabbatPay) },
    { name: "נסיעות",         value: Math.round(payslip.travel) },
    { name: "תוספות",         value: Math.round(payslip.briefingPay) },
    ...(couponTotal > 0 ? [{ name: "קופון נסיעות", value: couponTotal }] : []),
  ].filter(d => d.value > 0);

  const deductionRows = [
    { label: "ביטוח לאומי",         icon: Shield,     val: payslip.nationalInsurance, color: "#ef4444" },
    { label: "מס בריאות",           icon: HeartPulse, val: payslip.healthInsurance,   color: "#f97316" },
    { label: "הראל חיסכון (7%)",    icon: TrendingUp, val: payslip.harelSavings,      color: "#8b5cf6" },
    { label: "הראל לימודים (2.5%)", icon: TrendingUp, val: payslip.harelStudy,        color: "#8b5cf6" },
    { label: "הראל נסיעות (5%)",    icon: TrendingUp, val: payslip.harelTravel,       color: "#8b5cf6" },
    { label: "הראל נוסף (7%)",      icon: TrendingUp, val: payslip.extraHarel,        color: "#8b5cf6" },
  ].filter(r => r.val > 0);

  return (
    <div className="px-4 pt-4 space-y-4">

      {/* Monthly target */}
      <div className="rounded-3xl border border-sky-500/20 bg-white/5 backdrop-blur-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-sky-400" />
            <p className="text-sm font-black text-white">יעד חודשי</p>
          </div>
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                className="w-24 bg-white/10 border border-white/15 rounded-xl px-2 py-1 text-sm text-white text-left outline-none focus:border-sky-500/50"
                dir="ltr" />
              <button onClick={() => { onGoalChange(Number(goalInput) || 10000); setEditingGoal(false); }}
                className="text-[10px] px-2.5 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold">שמור</button>
            </div>
          ) : (
            <button onClick={() => setEditingGoal(true)}
              className="text-[10px] text-white/35 hover:text-white/60 transition-colors font-semibold">
              {fmtNis(monthlyGoal)} ✏️
            </button>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${targetPct}%`, background: targetPct >= 100 ? "#10b981" : targetPct >= 70 ? "#0ea5e9" : "#f59e0b" }} />
          </div>
          <div className="flex justify-between text-[10px] text-white/40">
            <span>{fmtNis(totalWithCoupon)}</span>
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
                formatter={(v: number) => [fmtNis(v), ""]} />
              <Legend formatter={v => <span className="text-[10px] text-white/60">{v}</span>} />
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

      {/* FIX 2: Coupon income shown as separate card */}
      {couponTotal > 0 && (
        <div className="rounded-3xl border border-orange-500/20 bg-orange-500/8 backdrop-blur-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-white">הכנסה נוספת 🎫</p>
            <p className="text-[10px] text-white/40 mt-0.5">{couponCount} קופוני נסיעות × ₪68</p>
          </div>
          <p className="text-xl font-black text-orange-300">+{fmtNis(couponTotal)}</p>
        </div>
      )}

      {/* Net-to-Bank predictor */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
        <p className="text-sm font-black text-white">מניין לבנק 🏦</p>
        <div className="flex justify-between items-center py-2 border-b border-white/8">
          <span className="text-xs font-semibold text-white/70">ברוטו</span>
          <span className="text-base font-black text-white">{fmtNis(payslip.totalGross)}</span>
        </div>
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
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-3 flex justify-between items-center">
          <span className="text-sm font-black text-white">נטו לבנק 💳</span>
          <span className="text-xl font-black text-emerald-400">{fmtNis(payslip.netPay)}</span>
        </div>
        {couponTotal > 0 && (
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/8 p-3 flex justify-between items-center">
            <span className="text-sm font-black text-white">כולל קופונים 🎫</span>
            <span className="text-xl font-black text-orange-300">{fmtNis(payslip.netPay + couponTotal)}</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          {([
            ["ניכויים חובה", payslip.totalMandatory, "#ef4444"],
            ["פנסיה/חיסכון", payslip.totalPension,   "#8b5cf6"],
            ["סה״כ ניכויים", payslip.totalDeductions, "#f97316"],
          ] as [string, number, string][]).map(([label, val, color]) => (
            <div key={label} className="rounded-xl border border-white/8 bg-white/4 p-2">
              <p className="text-[8px] text-white/35">{label}</p>
              <p className="text-xs font-black" style={{ color }}>{fmtNis(val)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 3 — REPORTS & MONTHLY SUMMARY (FIX 4)
// ═══════════════════════════════════════════════════════════════════════
function ReportsTab({ shifts, settings, monthLabel }: {
  shifts: ShiftRow[]; settings: PayrollSettings; monthLabel: string;
}) {
  const payslip    = calcMonthlyPayslip(shifts, settings);
  const couponCount = shifts.filter(hasCoupon).length;
  const couponTotal = couponCount * 68;

  const handleICS = () => {
    if (shifts.length === 0) { toast.error("אין משמרות לייצוא"); return; }
    const ics = generateICS(shifts, monthLabel);
    downloadBlob(ics, `משמרות-${monthLabel}.ics`, "text/calendar;charset=utf-8");
    toast.success("קובץ .ics הורד — פתח ביומן Google/Apple");
  };

  const handleCSV = () => {
    if (shifts.length === 0) { toast.error("אין משמרות לייצוא"); return; }
    exportCSV(shifts, settings, monthLabel);
  };

  const handlePayslip = () => {
    if (shifts.length === 0) { toast.error("אין משמרות לייצוא"); return; }
    exportPayslipReport(payslip, shifts, settings, monthLabel, couponTotal);
  };

  // Adverse-inspired big number grid
  const summaryStats = [
    { icon: Clock,     label: "שעות",      value: String(payslip.totalHours),   color: "#0ea5e9" },
    { icon: Zap,       label: "שעות שבת",  value: String(payslip.shabbatHours), color: "#f59e0b" },
    { icon: Wallet,    label: "קופונים",   value: String(couponCount),          color: "#f97316" },
    { icon: BarChart2, label: "משמרות",    value: String(payslip.totalShifts),  color: "#10b981" },
  ];

  return (
    <div className="px-4 pt-4 space-y-4">

      {/* FIX 4: Monthly Summary — no rights, Adverse big-number grid */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-white">סיכום חודשי 📊</p>
            <p className="text-[10px] text-white/35 mt-0.5">{monthLabel}</p>
          </div>
        </div>

        {/* Adverse-style: 2×2 big-number grid */}
        <div className="grid grid-cols-2 divide-x divide-y divide-white/8 border-t border-white/8" style={{ direction: "ltr" }}>
          {summaryStats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-5 text-center" style={{ direction: "rtl" }}>
              <Icon className="h-4 w-4 mx-auto mb-2.5 opacity-50" style={{ color }} />
              <p className="text-4xl font-black text-white leading-none tracking-tight">{value}</p>
              <p className="text-[10px] text-white/40 mt-2 font-semibold uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Gross + Net totals row */}
        <div className="px-4 pb-4 pt-3 flex gap-3 border-t border-white/8">
          <div className="flex-1 rounded-2xl border border-sky-500/20 bg-sky-500/8 p-3 text-center">
            <p className="text-[9px] text-white/35 mb-0.5">ברוטו חודש</p>
            <p className="text-base font-black text-sky-300">{fmtNis(payslip.totalGross + couponTotal)}</p>
          </div>
          <div className="flex-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-3 text-center">
            <p className="text-[9px] text-white/35 mb-0.5">נטו לבנק</p>
            <p className="text-base font-black text-emerald-300">{fmtNis(payslip.netPay + couponTotal)}</p>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-2.5">
        <p className="text-sm font-black text-white">ייצוא דוחות 📤</p>

        {/* Payslip — N99 "Pay" button inspired: gradient CTA */}
        <button onClick={handlePayslip}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl font-black text-sm active:scale-[0.98] transition-all text-white"
          style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)", boxShadow: "0 0 24px rgba(14,165,233,0.25)" }}>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 opacity-80" />
            <div className="text-right">
              <p className="text-sm font-black">הדפס תלוש שכר</p>
              <p className="text-[10px] opacity-60 font-normal">פירוט מלא ברוטו / ניכויים / נטו</p>
            </div>
          </div>
          <Download className="h-4 w-4 opacity-60" />
        </button>

        <button onClick={handleCSV}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 hover:bg-emerald-500/12 active:scale-[0.98] transition-all">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Download className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-bold text-white">ייצוא Excel / CSV</p>
            <p className="text-[10px] text-white/35">קובץ גיליון עם כל המשמרות</p>
          </div>
        </button>

        <button onClick={handleICS}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-violet-500/20 bg-violet-500/8 hover:bg-violet-500/12 active:scale-[0.98] transition-all">
          <div className="h-9 w-9 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-bold text-white">סנכרון יומן (.ics)</p>
            <p className="text-[10px] text-white/35">Google Calendar / Apple Calendar</p>
          </div>
        </button>
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
    setVals(prev => ({ ...prev, [k]: k === "income_sync_mode" ? v : Number(v) }));

  const handleSave = async () => {
    try {
      await saveSettings.mutateAsync(vals);
      setSaved(true);
      toast.success("הגדרות נשמרו ✅");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      toast.error(`שגיאה בשמירה: ${(err as Error)?.message ?? ""}`);
    }
  };

  const Field = ({ label, field, suffix = "₪", step = "0.01" }: {
    label: string; field: keyof PayrollSettings; suffix?: string; step?: string;
  }) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-white/40">{label}</label>
      <div className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-xl px-3 py-2 focus-within:border-sky-500/40">
        <input type="number" step={step} value={Number(vals[field])} onChange={e => set(field, e.target.value)}
          className="flex-1 bg-transparent text-sm text-white outline-none text-left" dir="ltr" />
        <span className="text-[10px] text-white/30 shrink-0">{suffix}</span>
      </div>
    </div>
  );

  return (
    <div className="px-4 pt-4 space-y-4 pb-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
        <p className="text-sm font-black text-white">תעריפים שעתיים 💰</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="שכר בסיס/שעה"         field="base_hourly_rate"    />
          <Field label="שכר חלופי/שעה"         field="alt_hourly_rate"     />
          <Field label="שכר שבת/שעה (150%)"    field="shabbat_hourly_rate" />
          <Field label="שיקום/שעה"             field="recovery_per_hour"   />
          <Field label="מצוינות/שעה"           field="excellence_per_hour" />
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
        <p className="text-sm font-black text-white">תוספות למשמרת</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="נסיעות/משמרת"          field="travel_per_shift"         />
          <Field label="רענון/משמרת"           field="briefing_per_shift"       />
          <Field label="ניכוי צהריים"          field="lunch_deduction"          />
          <Field label="איגוד לאומי"           field="union_national_deduction" />
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
        <p className="text-sm font-black text-white">ניכויים (%)</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ביטוח לאומי %"         field="national_insurance_pct"  suffix="%" step="0.01" />
          <Field label="מס בריאות %"            field="health_insurance_pct"    suffix="%" step="0.01" />
          <Field label="הראל חיסכון %"          field="harel_savings_pct"       suffix="%" step="0.01" />
          <Field label="הראל לימודים %"         field="harel_study_pct"         suffix="%" step="0.01" />
          <Field label="הראל נסיעות %"          field="harel_travel_pct"        suffix="%" step="0.01" />
          <Field label="הראל נוסף %"            field="extra_harel_pct"         suffix="%" step="0.01" />
        </div>
      </div>
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
  const [activeTab,   setActiveTab]   = useState<WorkTab>("dashboard");
  const [noBreak,     setNoBreak]     = useState(false);
  const [liveShift,   setLiveShift]   = useState<LiveShiftState | null>(null);
  const [monthlyGoal, setMonthlyGoal] = useState(() => Number(localStorage.getItem("work_monthly_goal") || "10000"));

  const updateGoal = useCallback((v: number) => {
    setMonthlyGoal(v);
    localStorage.setItem("work_monthly_goal", String(v));
  }, []);

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: settings } = usePayrollSettings();
  const { data: shifts }   = useWorkShifts(year, month);

  const resolvedSettings = settings ?? DEFAULT_PAYROLL_SETTINGS;
  const resolvedShifts   = (shifts ?? []) as ShiftRow[];

  const monthLabel  = `${MONTHS_HE[month - 1]} ${year}`;
  const payslip     = calcMonthlyPayslip(resolvedShifts, resolvedSettings);
  const couponTotal = resolvedShifts.filter(hasCoupon).length * 68;

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
        <div className="absolute inset-0 bg-[#080b12]/55 pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sky-500/12 blur-[140px]" />
          <div className="absolute bottom-40 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10 pb-32">
          {/* Monthly gross summary */}
          <div className="px-4 pt-4 pb-2 flex justify-end">
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/8 backdrop-blur-xl px-3 py-2 text-center shrink-0">
              <p className="text-[9px] text-white/35 font-medium">ברוטו חודש</p>
              <p className="text-sm font-black text-sky-300">{fmtNis(payslip.totalGross + couponTotal)}</p>
            </div>
          </div>

          {/* Live banner (compact, shown on non-dashboard tabs) */}
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
          <div className="sticky top-14 z-20 px-4 py-2 bg-black/25 backdrop-blur-xl">
            <div className="flex gap-1 p-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
              {TABS.map(t => (
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
            <DashboardTab
              liveShift={liveShift} setLiveShift={setLiveShift}
              noBreak={noBreak} setNoBreak={setNoBreak}
              settings={resolvedSettings} shifts={resolvedShifts}
            />
          )}
          {activeTab === "finance" && (
            <FinanceTab payslip={payslip} shifts={resolvedShifts} monthlyGoal={monthlyGoal} onGoalChange={updateGoal} />
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
