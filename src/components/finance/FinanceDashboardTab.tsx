import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Minus, Check, X, RotateCcw, Sparkles } from "lucide-react";
import {
  useMonthlyFinance,
  useAddExpense,
  useAddIncome,
  useExpenseHistory,
  useIncomeHistory,
  useFinanceSettings,
  DEFAULT_EXPENSE_CATEGORIES,
} from "@/hooks/use-finance-data";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

// ─── AI Categorization ────────────────────────────────────────────────────────

const AI_RULES: [string[], string][] = [
  [["סופר", "רמי לוי", "שופרסל", "קארפור", "מקדונלד", "בורגר", "פיצה", "קפה", "ארומה", "מסעדה", "שווארמה", "סושי", "אוכל", "מינימרקט"], "מזון"],
  [["דלק", "סונול", "פז", "דור אלון", "yellow", "תחנת דלק"], "דלק"],
  [["נטפליקס", "ספוטיפיי", "apple", "גוגל", "אמזון", "מנוי", "disney", "hbo", "youtube premium"], "מנויים"],
  [["מכבי", "קופת חולים", "כללית", "לאומית", "סופר פארם", "רופא", "בית מרקחת", "תרופ", "קלאוס"], "בריאות"],
  [["זארא", "zara", "h&m", "קסטרו", "fox", "ביגוד", "נעל", "adidas", "nike", "כרמל", "מגשימים"], "ביגוד"],
  [["סינמה", "קולנוע", "פאב", "בר ", "מסיבה", "כרטיס"], "בילויים"],
  [["אל על", "ארקיע", "מלון", "טיסה", "booking", "airbnb", "אופקים"], "טיולים"],
  [["איקאה", "ikea", "ace", "ריהוט", "שטיח", "תאורה", "כלים"], "בית"],
];

function aiCategorize(text: string): string | null {
  if (!text.trim()) return null;
  const lower = text.toLowerCase();
  for (const [kws, cat] of AI_RULES) {
    if (kws.some((k) => lower.includes(k.toLowerCase()))) return cat;
  }
  return null;
}

// ─── Health Score ─────────────────────────────────────────────────────────────

function computeHealthScore(
  savingsPct: number,
  savingsGoal: number,
  balance: number,
  forecastBalance: number,
  totalIncome: number
): number {
  if (totalIncome === 0) return 0;
  const s = Math.min(45, (savingsPct / Math.max(savingsGoal, 1)) * 45);
  const b = balance > 0 ? 30 : 0;
  const f = forecastBalance > 0 ? 15 : 0;
  return Math.round(Math.min(100, Math.max(0, s + b + f + 10)));
}

// ─── Health Score Gauge (SVG arc) ─────────────────────────────────────────────

function HealthScoreGauge({ score }: { score: number }) {
  const R = 44, CX = 56, CY = 58, SW = 10;
  const START = 135, SWEEP = 270;
  const toR = (d: number) => (d * Math.PI) / 180;

  function arc(a1: number, a2: number) {
    const x1 = CX + R * Math.cos(toR(a1)), y1 = CY + R * Math.sin(toR(a1));
    const x2 = CX + R * Math.cos(toR(a2)), y2 = CY + R * Math.sin(toR(a2));
    return `M ${x1} ${y1} A ${R} ${R} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  }

  const scoreAngle = START + (score / 100) * SWEEP;
  const color = score >= 70 ? "#34d399" : score >= 40 ? "#f59e0b" : "#f43f5e";
  const label = score >= 70 ? "מצויין 💪" : score >= 40 ? "סביר ⚡" : "זקוק שיפור 🔴";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="112" height="116" viewBox="0 0 112 116" aria-label={`ציון פיננסי ${score}`}>
        <path
          d={arc(START, START + SWEEP)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={SW}
          strokeLinecap="round"
        />
        {score > 0 && (
          <path
            d={arc(START, scoreAngle)}
            fill="none"
            stroke={color}
            strokeWidth={SW}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}99)` }}
          />
        )}
        <text
          x={CX} y={CY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="24"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
        >
          {score}
        </text>
        <text
          x={CX} y={CY + 19}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize="9"
          fontFamily="system-ui, sans-serif"
        >
          / 100
        </text>
      </svg>
      <p className="text-[11px] font-bold" style={{ color, letterSpacing: 0 }}>{label}</p>
    </div>
  );
}

// ─── Apple-style Goal Rings ───────────────────────────────────────────────────

function GoalRings({
  savingsPct,
  savingsGoal,
  expensePct,
  balancePct,
}: {
  savingsPct: number;
  savingsGoal: number;
  expensePct: number;
  balancePct: number;
}) {
  const rings = [
    {
      r: 48,
      pct: Math.min(1, savingsPct / Math.max(savingsGoal, 1)),
      color: savingsPct >= savingsGoal ? "#34d399" : savingsPct >= savingsGoal * 0.5 ? "#f59e0b" : "#f43f5e",
      label: "חיסכון",
    },
    {
      r: 33,
      pct: Math.min(1, expensePct),
      color: expensePct > 0.9 ? "#f43f5e" : expensePct > 0.75 ? "#f59e0b" : "#38bdf8",
      label: "הוצאות",
    },
    {
      r: 18,
      pct: Math.max(0, Math.min(1, balancePct)),
      color: balancePct > 0.15 ? "#34d399" : balancePct > 0 ? "#f59e0b" : "#f43f5e",
      label: "מאזן",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="112" height="112" viewBox="0 0 112 112" aria-label="טבעות יעד">
        {rings.map(({ r, pct, color }) => {
          const circ = 2 * Math.PI * r;
          return (
            <g key={r} transform="rotate(-90 56 56)">
              <circle
                cx={56} cy={56} r={r}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={9}
                strokeLinecap="round"
              />
              {pct > 0.01 && (
                <circle
                  cx={56} cy={56} r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={9}
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - pct)}
                  style={{
                    filter: `drop-shadow(0 0 5px ${color}99)`,
                    transition: "stroke-dashoffset 1s ease",
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex gap-2.5">
        {rings.map(({ r, color, label }) => (
          <div key={r} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-white/40" style={{ letterSpacing: 0 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 space-y-1.5">
      <p className="text-[10px] text-white/40" style={{ letterSpacing: 0 }}>{label}</p>
      <p className={`text-sm font-black tabular-nums ${color}`} dir="ltr">
        ₪{fmt(Math.abs(value))}
      </p>
    </div>
  );
}

// ─── Medals Row ───────────────────────────────────────────────────────────────

const MONTHS_SHORT_HE = [
  "ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יונ׳",
  "יול׳", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳",
];

function useMedals(savingsGoal: number) {
  const { data: expH } = useExpenseHistory(6);
  const { data: incH } = useIncomeHistory(6);

  return useMemo(() => {
    const expM: Record<string, number> = {};
    const incM: Record<string, number> = {};

    (expH || []).forEach((e: any) => {
      const k = e.date.slice(0, 7);
      expM[k] = (expM[k] || 0) + Number(e.amount);
    });
    (incH || []).forEach((i: any) => {
      const k = i.date.slice(0, 7);
      incM[k] = (incM[k] || 0) + Number(i.amount);
    });

    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const inc = incM[k] || 0;
      const exp = expM[k] || 0;
      const pct = inc > 0 ? ((inc - exp) / inc) * 100 : 0;
      return { key: k, monthIdx: d.getMonth(), metGoal: inc > 0 && pct >= savingsGoal };
    });
  }, [expH, incH, savingsGoal]);
}

function MedalsRow({ savingsGoal }: { savingsGoal: number }) {
  const months = useMedals(savingsGoal);

  let streak = 0;
  for (let i = months.length - 1; i >= 0; i--) {
    if (months[i].metGoal) streak++;
    else break;
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black text-white/70" style={{ letterSpacing: 0 }}>
          {streak >= 2 ? `🏆 ${streak} חודשים רצופים!` : streak === 1 ? "🥇 חודש ראשון!" : "מדליות חיסכון"}
        </p>
        <p className="text-[10px] text-white/25">6 חודשים אחרונים</p>
      </div>
      <div className="flex justify-between">
        {months.map((m) => (
          <div key={m.key} className="flex flex-col items-center gap-1 flex-1">
            <span className={`text-xl leading-none ${m.metGoal ? "" : "opacity-15 grayscale"}`}>
              {m.metGoal ? "🥇" : "⭕"}
            </span>
            <p className="text-[9px] text-white/30" style={{ letterSpacing: 0 }}>
              {MONTHS_SHORT_HE[m.monthIdx]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Floating Quick Add ───────────────────────────────────────────────────────

type EntryType = "expense" | "income";

const INCOME_SOURCES: { name: string; icon: string }[] = [
  { name: "משכורת", icon: "💼" },
  { name: "פרילנס", icon: "💻" },
  { name: "שיעורים", icon: "📚" },
  { name: "אחר", icon: "💰" },
];

interface PendingEntry {
  type: EntryType;
  amount: number;
  category: string;
  description?: string;
  date: string;
}

function FloatingQuickAdd({ year, month }: { year: number; month: number }) {
  const [open, setOpen] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>("expense");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0].name);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingEntry | null>(null);
  const [countdown, setCountdown] = useState(3);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addExpense = useAddExpense();
  const addIncome = useAddIncome();

  // AI categorize on vendor change
  useEffect(() => {
    const s = aiCategorize(vendor);
    setAiSuggestion(s);
    if (s && entryType === "expense") setCategory(s);
  }, [vendor, entryType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (saveRef.current) clearTimeout(saveRef.current);
    };
  }, []);

  function handleTypeChange(t: EntryType) {
    setEntryType(t);
    setCategory(t === "expense" ? DEFAULT_EXPENSE_CATEGORIES[0].name : INCOME_SOURCES[0].name);
    setAiSuggestion(null);
  }

  function resetForm() {
    setAmount("");
    setVendor("");
    setCategory(DEFAULT_EXPENSE_CATEGORIES[0].name);
    setAiSuggestion(null);
  }

  function handleSubmit() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error("הזן סכום תקין"); return; }

    const day = String(new Date().getDate()).padStart(2, "0");
    const date = `${year}-${String(month).padStart(2, "0")}-${day}`;
    const entry: PendingEntry = {
      type: entryType,
      amount: num,
      category,
      description: vendor.trim() || undefined,
      date,
    };

    setPending(entry);
    setCountdown(3);
    setOpen(false);
    resetForm();

    // Tick countdown
    tickRef.current = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          return 0;
        }
        return p - 1;
      });
    }, 1000);

    // Commit after 3.1s
    saveRef.current = setTimeout(async () => {
      try {
        if (entry.type === "expense") {
          await addExpense.mutateAsync({
            amount: entry.amount,
            category: entry.category,
            description: entry.description,
            date: entry.date,
            expense_type: "variable",
            is_recurring: false,
            needs_review: false,
          });
        } else {
          await addIncome.mutateAsync({
            amount: entry.amount,
            category: entry.category,
            description: entry.description,
            source: "manual",
            date: entry.date,
          });
        }
        toast.success(`₪${fmt(entry.amount)} נשמר בהצלחה ✓`);
      } catch (e: any) {
        toast.error("שגיאה: " + e.message);
      } finally {
        setPending(null);
      }
    }, 3100);
  }

  function handleUndo() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (saveRef.current) clearTimeout(saveRef.current);
    setPending(null);
    toast.info("ביטלת את ההוספה");
  }

  const cats =
    entryType === "expense"
      ? DEFAULT_EXPENSE_CATEGORIES
      : INCOME_SOURCES;

  return (
    <>
      {/* 3-second Undo Banner */}
      {pending && (
        <div
          className="fixed bottom-24 inset-x-4 z-50 rounded-2xl bg-[#161b2a]/98 backdrop-blur-xl border border-white/15 px-4 py-3 shadow-2xl"
          dir="rtl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                  pending.type === "expense" ? "bg-rose-500/20" : "bg-emerald-500/20"
                }`}
              >
                {pending.type === "expense" ? (
                  <Minus className="h-4 w-4 text-rose-400" />
                ) : (
                  <Plus className="h-4 w-4 text-emerald-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate" style={{ letterSpacing: 0 }}>
                  ₪{fmt(pending.amount)} · {pending.category}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {countdown > 0
                    ? `נשמר בעוד ${countdown} ${countdown === 1 ? "שנייה" : "שניות"}`
                    : "שומר..."}
                </p>
              </div>
            </div>
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 active:scale-95 transition-all shrink-0"
              style={{ letterSpacing: 0 }}
            >
              <RotateCcw className="h-3 w-3" />
              בטל
            </button>
          </div>
          {/* Progress bar draining to zero */}
          <div className="mt-3 h-0.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all ease-linear"
              style={{ width: `${(countdown / 3) * 100}%`, transitionDuration: "990ms" }}
            />
          </div>
        </div>
      )}

      {/* FAB */}
      {!open && !pending && (
        <button
          onClick={() => setOpen(true)}
          aria-label="הוסף פעולה פיננסית"
          className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-2xl bg-emerald-500 shadow-xl shadow-emerald-500/40 flex items-center justify-center text-white hover:bg-emerald-400 active:scale-90 transition-all"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Quick Add Slide-up Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end" dir="rtl">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="relative w-full max-h-[88vh] overflow-y-auto rounded-t-3xl bg-[#0e1320]/98 backdrop-blur-2xl border-t border-white/10 px-5 pt-4 pb-10 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-1" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-base font-black text-white" style={{ letterSpacing: 0 }}>
                הוספה מהירה
              </p>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-2">
              {(["expense", "income"] as EntryType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${
                    entryType === t
                      ? t === "expense"
                        ? "bg-rose-500/20 border border-rose-400/40 text-rose-400"
                        : "bg-emerald-500/20 border border-emerald-400/40 text-emerald-400"
                      : "bg-white/5 border border-white/10 text-white/40"
                  }`}
                  style={{ letterSpacing: 0 }}
                >
                  {t === "expense" ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {t === "expense" ? "הוצאה" : "הכנסה"}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="relative">
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xl font-black text-white/30">
                ₪
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pe-12 ps-4 py-4 rounded-2xl bg-white/8 border border-white/10 text-2xl font-black text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
                dir="ltr"
                autoFocus
                inputMode="decimal"
              />
            </div>

            {/* Vendor with AI */}
            <div>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="שם ספק / תיאור — AI יזהה קטגוריה אוטומטית"
                className="w-full px-4 py-3 rounded-2xl bg-white/8 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sky-500/40 focus:bg-white/10 transition-all"
              />
              {aiSuggestion && entryType === "expense" && (
                <div className="flex items-center gap-1.5 mt-2 px-1">
                  <Sparkles className="h-3 w-3 text-sky-400 shrink-0" />
                  <p className="text-[11px] text-sky-400" style={{ letterSpacing: 0 }}>
                    AI זיהה: <span className="font-black">{aiSuggestion}</span> — נבחר אוטומטית
                  </p>
                </div>
              )}
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap gap-1.5">
              {cats.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                    category === cat.name
                      ? entryType === "expense"
                        ? "border-rose-400/50 bg-rose-400/15 text-rose-300"
                        : "border-emerald-400/50 bg-emerald-400/15 text-emerald-300"
                      : "border-white/10 bg-white/5 text-white/40"
                  }`}
                  style={{ letterSpacing: 0 }}
                >
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!amount}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                entryType === "expense"
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-400 active:scale-[0.98]"
                  : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 active:scale-[0.98]"
              }`}
              style={{ letterSpacing: 0 }}
            >
              <span className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                {entryType === "expense" ? "שמור הוצאה" : "שמור הכנסה"}
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function FinanceDashboardTab({ year, month }: { year: number; month: number }) {
  const fin = useMonthlyFinance(year, month);
  const { data: settings } = useFinanceSettings();
  const savingsGoal = settings?.savings_goal_pct ?? fin.savingsGoal;

  const score = computeHealthScore(
    fin.savingsPct,
    savingsGoal,
    fin.balance,
    fin.forecastBalance,
    fin.totalIncome
  );
  const expensePct = fin.forecastExpenses > 0 ? fin.totalExpenses / fin.forecastExpenses : 0;
  const balancePct = fin.totalIncome > 0 ? Math.max(0, fin.balance / fin.totalIncome) : 0;

  return (
    <div className="space-y-4">
      {/* Health Score + Goal Rings */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5">
        <p className="text-[11px] font-bold text-white/40 mb-4" style={{ letterSpacing: 0 }}>
          ציון בריאות פיננסית
        </p>
        <div className="flex items-start justify-around gap-2">
          <HealthScoreGauge score={score} />
          <GoalRings
            savingsPct={fin.savingsPct}
            savingsGoal={savingsGoal}
            expensePct={expensePct}
            balancePct={balancePct}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard label="הכנסות" value={fin.totalIncome} color="text-emerald-400" />
        <SummaryCard label="הוצאות" value={fin.totalExpenses} color="text-rose-400" />
        <SummaryCard
          label="מאזן"
          value={fin.balance}
          color={fin.balance >= 0 ? "text-sky-400" : "text-rose-400"}
        />
      </div>

      {/* Medals */}
      <MedalsRow savingsGoal={savingsGoal} />

      {/* Floating Quick Add — fixed, unmounts when leaving dashboard tab */}
      <FloatingQuickAdd year={year} month={month} />
    </div>
  );
}
