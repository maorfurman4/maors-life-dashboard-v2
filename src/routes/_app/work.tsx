import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Briefcase, Play, Square, ChevronRight,
  Coffee, Plus, Clock,
} from "lucide-react";
import { useAddShift, usePayrollSettings, useWorkShifts } from "@/hooks/use-work-data";
import {
  calcShiftBreakdown, SHIFT_HOURS, SHIFT_LABELS, SHIFT_TIMES,
  DEFAULT_PAYROLL_SETTINGS, type PayrollSettings, type ShiftRow,
} from "@/lib/payroll-engine";
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
  key: string;
  label: string;
  sublabel: string;
  emoji: string;
  image: string;
  type: string;
  isShabbat: boolean;
  color: string;
  bonusLabel: string | null;
  bonusAmount: number | null;
  hasBriefing: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS: { key: WorkTab; label: string }[] = [
  { key: "dashboard", label: "בית"    },
  { key: "finance",   label: "הבנק"   },
  { key: "reports",   label: "דוחות"  },
  { key: "settings",  label: "חוזה"   },
];

const SHIFT_CARDS: ShiftCardDef[] = [
  {
    key: "morning",
    label: "בוקר",
    sublabel: "07:00 – 15:00",
    emoji: "🌅",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    type: "morning",
    isShabbat: false,
    color: "#f97316",
    bonusLabel: "+68₪ נסיעות",
    bonusAmount: 68,
    hasBriefing: false,
  },
  {
    key: "evening",
    label: "ערב / לילה",
    sublabel: "15:00 – 07:00",
    emoji: "🌙",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80",
    type: "afternoon",
    isShabbat: false,
    color: "#6366f1",
    bonusLabel: null,
    bonusAmount: null,
    hasBriefing: false,
  },
  {
    key: "shabbat",
    label: "שבת / חג",
    sublabel: "שכר 150%",
    emoji: "✨",
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600&q=80",
    type: "morning",
    isShabbat: true,
    color: "#f59e0b",
    bonusLabel: "150% תעריף",
    bonusAmount: null,
    hasBriefing: false,
  },
  {
    key: "briefing",
    label: "רענון",
    sublabel: "06:00 – 19:00",
    emoji: "📋",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80",
    type: "briefing",
    isShabbat: false,
    color: "#10b981",
    bonusLabel: "תוספת רענון",
    bonusAmount: null,
    hasBriefing: true,
  },
];

const MONTHS_HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt2   = (n: number) => String(n).padStart(2, "0");
const fmtNis = (n: number) => `₪${n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today  = () => new Date().toISOString().slice(0, 10);

// ═══════════════════════════════════════════════════════════════════════
//  LIVE TRACKER
// ═══════════════════════════════════════════════════════════════════════
function LiveTracker({ live, settings, onStop }: {
  live: LiveShiftState;
  settings: PayrollSettings;
  onStop: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - live.startMs) / 1000)), 1000);
    return () => clearInterval(id);
  }, [live.startMs]);

  const hours  = elapsed / 3600;
  const effH   = live.noBreak ? hours : Math.max(0, hours - 0.5);
  const rate   = live.isShabbat
    ? settings.shabbat_hourly_rate
    : (live.role === "shift_manager" ? settings.alt_hourly_rate : settings.base_hourly_rate);
  const earned = effH * (rate + settings.recovery_per_hour + settings.excellence_per_hour);

  const hh = Math.floor(elapsed / 3600);
  const mm = Math.floor((elapsed % 3600) / 60);
  const ss = elapsed % 60;

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
        <button onClick={onStop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-bold hover:bg-red-500/20 active:scale-95 transition-all">
          <Square className="h-3 w-3 fill-current" />סיים
        </button>
      </div>

      <div className="text-center py-2">
        <p className="text-5xl font-black text-white tracking-wider font-mono">
          {fmt2(hh)}:{fmt2(mm)}:{fmt2(ss)}
        </p>
        <p className="text-[10px] text-white/35 mt-1.5">
          {live.noBreak ? "ללא הפסקה" : "כולל ניכוי 30 דק׳"}
        </p>
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

// ═══════════════════════════════════════════════════════════════════════
//  BREAK TOGGLE
// ═══════════════════════════════════════════════════════════════════════
function BreakToggle({ noBreak, onChange }: { noBreak: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!noBreak)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-xl transition-all duration-200 ${
        noBreak ? "border-sky-500/30 bg-sky-500/8" : "border-white/10 bg-white/5"}`}>
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

// ═══════════════════════════════════════════════════════════════════════
//  QUICK-ADD SHIFT CARD  (image-backed)
// ═══════════════════════════════════════════════════════════════════════
function ShiftCard({ card, noBreak, settings, onLog, onStart }: {
  card: ShiftCardDef;
  noBreak: boolean;
  settings: PayrollSettings;
  onLog: (card: ShiftCardDef) => void;
  onStart: (card: ShiftCardDef) => void;
}) {
  const baseHours = SHIFT_HOURS[card.type] ?? 8;
  const effHours  = noBreak ? baseHours : baseHours - 0.5;
  const rate      = card.isShabbat ? settings.shabbat_hourly_rate : settings.base_hourly_rate;
  const gross     = effHours * rate
    + effHours * (settings.recovery_per_hour + settings.excellence_per_hour)
    + settings.travel_per_shift
    + (card.hasBriefing ? settings.briefing_per_shift : 0)
    + (card.bonusAmount ?? 0);

  return (
    <div className="relative flex-shrink-0 w-40 h-52 rounded-3xl overflow-hidden"
      style={{ backgroundImage: `url('${card.image}')`, backgroundSize: "cover", backgroundPosition: "center" }}>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/20" />
      {/* Color accent radial glow */}
      <div className="absolute inset-0 opacity-25" style={{ background: `radial-gradient(circle at top right, ${card.color}80, transparent 65%)` }} />

      {/* Emoji */}
      <span className="absolute top-3 right-3 text-2xl drop-shadow-lg leading-none">{card.emoji}</span>

      {/* Bonus badge */}
      {card.bonusLabel && (
        <div className="absolute top-3 left-2 px-2 py-0.5 rounded-lg text-[8px] font-black backdrop-blur-sm border"
          style={{ background: card.color + "28", borderColor: card.color + "50", color: card.color }}>
          {card.bonusLabel}
        </div>
      )}

      {/* Label */}
      <p className="absolute bottom-[88px] left-0 right-0 px-3 text-base font-black text-white text-right leading-tight">{card.label}</p>
      <p className="absolute bottom-[75px] left-0 right-0 px-3 text-[9px] text-white/45 text-right">{card.sublabel}</p>

      {/* Gross estimate */}
      <div className="absolute bottom-[50px] left-0 right-0 px-3">
        <p className="text-sm font-black text-right" style={{ color: card.color }}>{fmtNis(gross)}</p>
        <p className="text-[8px] text-white/30 text-right">{effHours}ש׳ · ברוטו משוער</p>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-2 left-2 right-2 flex gap-1.5">
        <button onClick={() => onStart(card)}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-black text-white transition-all active:scale-95"
          style={{ background: card.color + "cc", backdropFilter: "blur(8px)" }}>
          <Play className="h-2.5 w-2.5" />חי
        </button>
        <button onClick={() => onLog(card)}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-black text-white/70 border border-white/15 bg-white/10 backdrop-blur-sm transition-all active:scale-95">
          <Plus className="h-2.5 w-2.5" />רשום
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  SHIFT TICKET  (plane-ticket style)
// ═══════════════════════════════════════════════════════════════════════
function ShiftTicket({ shift, settings }: { shift: ShiftRow; settings: PayrollSettings }) {
  const bd     = calcShiftBreakdown(shift, settings);
  const hours  = shift.hours ?? (SHIFT_HOURS[shift.type] ?? 8);
  const times  = SHIFT_TIMES[shift.type] ?? { start: "—", end: "—" };
  const d      = new Date(shift.date);
  const dayHe  = d.toLocaleDateString("he-IL", { weekday: "short" });
  const day    = d.getDate();
  const mon    = MONTHS_HE[d.getMonth()].slice(0, 3);
  const accent = shift.is_shabbat_holiday ? "#f59e0b" : "#0ea5e9";

  return (
    <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-visible">
      {/* Punch-out circles simulating ticket tear */}
      <div className="absolute top-1/2 -translate-y-1/2 -right-3 h-6 w-6 rounded-full bg-[#080b12]" />
      <div className="absolute top-1/2 -translate-y-1/2 -left-3 h-6 w-6 rounded-full bg-[#080b12]" />

      <div className="flex items-stretch">
        {/* Date stub */}
        <div className="flex flex-col items-center justify-center px-4 py-4 min-w-[76px] shrink-0"
          style={{ borderRight: "1px dashed rgba(255,255,255,0.08)" }}>
          <p className="text-[9px] text-white/30">{dayHe}</p>
          <p className="text-2xl font-black text-white leading-none">{day}</p>
          <p className="text-[9px] text-white/30">{mon}</p>
          {shift.is_shabbat_holiday && (
            <span className="mt-1.5 text-[8px] px-1.5 py-0.5 rounded-full font-black"
              style={{ background: "#f59e0b18", color: "#f59e0b" }}>שבת</span>
          )}
        </div>

        {/* Shift body */}
        <div className="flex-1 px-4 py-4 flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
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
            {shift.notes && (
              <p className="text-[9px] text-white/25 mt-0.5 truncate">{shift.notes}</p>
            )}
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

// ═══════════════════════════════════════════════════════════════════════
//  DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════════════
function DashboardTab({ liveShift, setLiveShift, noBreak, setNoBreak, settings, shifts }: {
  liveShift: LiveShiftState | null;
  setLiveShift: (s: LiveShiftState | null) => void;
  noBreak: boolean;
  setNoBreak: (v: boolean) => void;
  settings: PayrollSettings;
  shifts: ShiftRow[];
}) {
  const addShift = useAddShift();

  const handleLog = async (card: ShiftCardDef) => {
    const baseH = SHIFT_HOURS[card.type] ?? 8;
    const hours = noBreak ? baseH : baseH - 0.5;
    const notes = card.bonusAmount ? `נסיעות +${card.bonusAmount}₪` : null;
    try {
      await addShift.mutateAsync({
        date: today(),
        type: card.type,
        role: "caregiver",
        is_shabbat_holiday: card.isShabbat,
        has_briefing: card.hasBriefing,
        hours,
        notes,
      });
      const gross = calcShiftBreakdown(
        { id: "", date: today(), type: card.type, role: "caregiver", is_shabbat_holiday: card.isShabbat, has_briefing: card.hasBriefing, hours, notes },
        settings
      ).totalGross + (card.bonusAmount ?? 0);
      toast.success(`✅ ${card.label} נרשמה — ${fmtNis(gross)} ברוטו`);
    } catch { toast.error("שגיאה בשמירה"); }
  };

  const handleStart = (card: ShiftCardDef) => {
    if (liveShift) { toast.error("יש כבר משמרת פעילה — סיים אותה קודם"); return; }
    setLiveShift({ type: card.type, startMs: Date.now(), isShabbat: card.isShabbat, noBreak, role: "caregiver" });
    toast.success(`🟢 ${card.label} — מד זמן פעיל!`);
  };

  const handleStop = async () => {
    if (!liveShift) return;
    const elapsed = (Date.now() - liveShift.startMs) / 3600000;
    const hours   = parseFloat((liveShift.noBreak ? elapsed : Math.max(0, elapsed - 0.5)).toFixed(2));
    try {
      await addShift.mutateAsync({
        date: today(),
        type: liveShift.type,
        role: liveShift.role,
        is_shabbat_holiday: liveShift.isShabbat,
        has_briefing: false,
        hours,
        notes: `משמרת חי — ${hours.toFixed(2)}ש׳`,
      });
      toast.success(`✅ משמרת הסתיימה — ${hours.toFixed(1)}ש׳ נרשמו`);
    } catch { toast.error("שגיאה בשמירה"); }
    setLiveShift(null);
  };

  const recent = shifts.slice(0, 3);

  return (
    <div className="px-4 pt-4 space-y-5">
      {/* Live tracker widget */}
      {liveShift && <LiveTracker live={liveShift} settings={settings} onStop={handleStop} />}

      {/* Break toggle */}
      <BreakToggle noBreak={noBreak} onChange={setNoBreak} />

      {/* Horizontal quick-add cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-sm font-black text-white">הוסף משמרת</p>
          <button className="flex items-center gap-1 text-[11px] text-white/35 hover:text-white/60 transition-colors">
            <span>כל הסוגים</span><ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-0.5 px-0.5"
          style={{ scrollSnapType: "x mandatory" }}>
          {SHIFT_CARDS.map((card) => (
            <div key={card.key} style={{ scrollSnapAlign: "start" }}>
              <ShiftCard
                card={card}
                noBreak={noBreak}
                settings={settings}
                onLog={handleLog}
                onStart={handleStart}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Recent shifts as tickets */}
      <div className="space-y-3">
        <p className="text-sm font-black text-white px-0.5">משמרות אחרונות</p>
        {recent.length === 0 ? (
          <div className="rounded-3xl border border-white/8 bg-white/3 backdrop-blur-xl p-8 text-center">
            <Briefcase className="h-8 w-8 text-white/15 mx-auto mb-2" />
            <p className="text-xs text-white/30">אין משמרות החודש — הוסף את הראשונה!</p>
          </div>
        ) : (
          recent.map((s) => <ShiftTicket key={s.id} shift={s} settings={settings} />)
        )}
        {shifts.length > 3 && (
          <p className="text-center text-[11px] text-sky-400/60 font-semibold py-1">
            + {shifts.length - 3} משמרות נוספות החודש
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Stub ─────────────────────────────────────────────────────────────────────
function ComingSoon({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="px-4 pt-20 flex flex-col items-center gap-4 text-center">
      <span className="text-7xl">{emoji}</span>
      <p className="text-white/80 font-black text-xl">{title}</p>
      <div className="px-5 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <p className="text-white/40 text-sm">{subtitle}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════
function WorkPage() {
  const [activeTab, setActiveTab]   = useState<WorkTab>("dashboard");
  const [noBreak,   setNoBreak]     = useState(false);
  const [liveShift, setLiveShift]   = useState<LiveShiftState | null>(null);

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: settings }     = usePayrollSettings();
  const { data: shifts }       = useWorkShifts(year, month);

  const resolvedSettings = settings ?? DEFAULT_PAYROLL_SETTINGS;
  const resolvedShifts   = (shifts ?? []) as ShiftRow[];

  const monthLabel  = `${MONTHS_HE[month - 1]} ${year}`;
  const totalEarned = resolvedShifts.reduce(
    (s, sh) => s + calcShiftBreakdown(sh, resolvedSettings).totalGross, 0
  );

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
        {/* Deep dark overlay */}
        <div className="absolute inset-0 bg-[#080b12]/85 pointer-events-none" />

        {/* Ambient glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sky-500/12 blur-[140px]" />
          <div className="absolute bottom-40 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10 pb-32">

          {/* ── Header ── */}
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

            {/* Earnings pill */}
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/8 backdrop-blur-xl px-3 py-2 text-center shrink-0">
              <p className="text-[9px] text-white/35 font-medium">ברוטו חודש</p>
              <p className="text-sm font-black text-sky-300">{fmtNis(totalEarned)}</p>
            </div>
          </div>

          {/* Live banner when tracker active & not on dashboard */}
          {liveShift && activeTab !== "dashboard" && (
            <div className="mx-4 mb-2 rounded-2xl border border-sky-500/25 bg-sky-500/8 backdrop-blur-xl px-4 py-2.5 flex items-center gap-3">
              <div className="relative h-2 w-2 shrink-0">
                <div className="absolute inset-0 rounded-full bg-sky-400 animate-ping opacity-75" />
                <div className="relative h-2 w-2 rounded-full bg-sky-400" />
              </div>
              <p className="text-xs font-bold text-sky-300 flex-1">
                {SHIFT_LABELS[liveShift.type] ?? liveShift.type} פעילה
              </p>
              <button onClick={() => setActiveTab("dashboard")} className="text-[10px] text-sky-400 font-bold">
                ← בית
              </button>
            </div>
          )}

          {/* ── Sticky Tab Bar ── */}
          <div className="sticky top-0 z-20 px-4 py-2 bg-black/60 backdrop-blur-xl">
            <div className="flex gap-1 p-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                    activeTab === t.key
                      ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tabs ── */}
          {activeTab === "dashboard" && (
            <DashboardTab
              liveShift={liveShift}
              setLiveShift={setLiveShift}
              noBreak={noBreak}
              setNoBreak={setNoBreak}
              settings={resolvedSettings}
              shifts={resolvedShifts}
            />
          )}
          {activeTab === "finance" && (
            <ComingSoon emoji="💰" title="הבנק — Phase 2"
              subtitle="Ring chart · Net predictor · יעד חודשי" />
          )}
          {activeTab === "reports" && (
            <ComingSoon emoji="📄" title="דוחות — Phase 3"
              subtitle="זכויות · ייצוא PDF/Excel · יומן .ics" />
          )}
          {activeTab === "settings" && (
            <ComingSoon emoji="⚙️" title="חוזה — Phase 4"
              subtitle="תעריפים · פנסיה · הגדרות שכר" />
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
