import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Minus, Check, X, RotateCcw, Sparkles, CreditCard as CardIcon, TrendingUp, TrendingDown } from "lucide-react";
import {
  useMonthlyFinance,
  useAddExpense,
  useAddIncome,
  useExpenseHistory,
  useIncomeHistory,
  useFinanceSettings,
  DEFAULT_EXPENSE_CATEGORIES,
} from "@/hooks/use-finance-data";
import { FT } from "@/lib/finance-theme";
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

// ─── Gold Credit Card ─────────────────────────────────────────────────────────

function GoldCreditCard({
  balance, totalIncome, totalExpenses, month, year,
}: {
  balance: number; totalIncome: number; totalExpenses: number;
  month: number; year: number;
}) {
  const mm = String(month).padStart(2, "0");
  const yy = String(year).slice(-2);

  return (
    <div
      className="relative rounded-[28px] p-5 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #3d2e18 0%, #5a4228 40%, #3d2e18 80%, #4a3520 100%)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(244,226,140,0.18)",
      }}
    >
      {/* Gold shimmer radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 15% 15%, rgba(244,226,140,0.18) 0%, transparent 55%), " +
            "radial-gradient(ellipse at 85% 85%, rgba(140,117,85,0.12) 0%, transparent 50%)",
        }}
      />

      {/* Top row */}
      <div className="relative flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(244,226,140,0.18)", border: "1px solid rgba(244,226,140,0.3)" }}
          >
            <CardIcon className="h-4 w-4" style={{ color: FT.gold }} />
          </div>
          <p className="text-[10px] font-bold" style={{ color: "rgba(244,226,140,0.55)", letterSpacing: 0 }}>
            יתרה חודשית
          </p>
        </div>
        <p className="text-[10px] font-mono tracking-widest" style={{ color: "rgba(244,226,140,0.35)" }}>
          ●●●● {mm}/{yy}
        </p>
      </div>

      {/* Balance */}
      <div className="relative mb-5">
        <p
          className="text-[34px] font-black tabular-nums leading-none"
          style={{ color: FT.gold, letterSpacing: 0 }}
          dir="ltr"
        >
          ₪{fmt(Math.abs(balance))}
        </p>
        <p className="text-[10px] mt-1.5 font-medium" style={{ color: balance < 0 ? FT.danger : "rgba(244,226,140,0.45)", letterSpacing: 0 }}>
          {balance < 0 ? "גירעון חודשי" : "מאזן חיובי"}
        </p>
      </div>

      {/* Income / Expenses */}
      <div className="relative flex justify-between items-end">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5" style={{ color: FT.success }} />
          <div>
            <p className="text-[9px]" style={{ color: "rgba(244,226,140,0.35)", letterSpacing: 0 }}>הכנסות</p>
            <p className="text-sm font-black tabular-nums" style={{ color: FT.success, letterSpacing: 0 }} dir="ltr">
              +₪{fmt(totalIncome)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-end">
            <p className="text-[9px]" style={{ color: "rgba(244,226,140,0.35)", letterSpacing: 0 }}>הוצאות</p>
            <p className="text-sm font-black tabular-nums" style={{ color: FT.danger, letterSpacing: 0 }} dir="ltr">
              -₪{fmt(totalExpenses)}
            </p>
          </div>
          <TrendingDown className="h-3.5 w-3.5" style={{ color: FT.danger }} />
        </div>
      </div>
    </div>
  );
}

// ─── Health Score Gauge (SVG arc) — gold palette ──────────────────────────────

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
  const color = score >= 70 ? FT.gold : score >= 40 ? FT.brown : FT.danger;
  const label = score >= 70 ? "מצויין" : score >= 40 ? "סביר" : "זקוק שיפור";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="112" height="116" viewBox="0 0 112 116" aria-label={`ציון פיננסי ${score}`}>
        <path
          d={arc(START, START + SWEEP)}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
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
            style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
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
          fill="rgba(255,255,255,0.25)"
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

// ─── Apple-style Goal Rings — gold/brown palette ──────────────────────────────

function GoalRings({
  savingsPct, savingsGoal, expensePct, balancePct,
}: {
  savingsPct: number; savingsGoal: number; expensePct: number; balancePct: number;
}) {
  const rings = [
    {
      r: 48,
      pct: Math.min(1, savingsPct / Math.max(savingsGoal, 1)),
      color: savingsPct >= savingsGoal ? FT.gold : savingsPct >= savingsGoal * 0.5 ? FT.brown : FT.danger,
      label: "חיסכון",
    },
    {
      r: 33,
      pct: Math.min(1, expensePct),
      color: expensePct > 0.9 ? FT.danger : expensePct > 0.75 ? FT.brown : FT.success,
      label: "הוצאות",
    },
    {
      r: 18,
      pct: Math.max(0, Math.min(1, balancePct)),
      color: balancePct > 0.15 ? FT.gold : balancePct > 0 ? FT.brown : FT.danger,
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
              <circle cx={56} cy={56} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} strokeLinecap="round" />
              {pct > 0.01 && (
                <circle
                  cx={56} cy={56} r={r} fill="none"
                  stroke={color} strokeWidth={9} strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - pct)}
                  style={{ filter: `drop-shadow(0 0 5px ${color}88)`, transition: "stroke-dashoffset 1s ease" }}
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
            <span className="text-[9px]" style={{ color: FT.textMuted, letterSpacing: 0 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Medals Row ───────────────────────────────────────────────────────────────

const MONTHS_SHORT_HE = [
  "ינו׳","פבר׳","מרץ","אפר׳","מאי","יונ׳","יול׳","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳",
];

function useMedals(savingsGoal: number) {
  const { data: expH } = useExpenseHistory(6);
  const { data: incH } = useIncomeHistory(6);

  return useMemo(() => {
    const expM: Record<string, number> = {};
    const incM: Record<string, number> = {};
    (expH || []).forEach((e: any) => { const k = e.date.slice(0, 7); expM[k] = (expM[k] || 0) + Number(e.amount); });
    (incH || []).forEach((i: any) => { const k = i.date.slice(0, 7); incM[k] = (incM[k] || 0) + Number(i.amount); });

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
    <div
      className="rounded-3xl p-4"
      style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black" style={{ color: FT.gold, letterSpacing: 0 }}>
          {streak >= 2 ? `🏆 ${streak} חודשים רצופים!` : streak === 1 ? "🥇 חודש ראשון!" : "מדליות חיסכון"}
        </p>
        <p className="text-[10px]" style={{ color: FT.textFaint }}>6 חודשים אחרונים</p>
      </div>
      <div className="flex justify-between">
        {months.map((m) => (
          <div key={m.key} className="flex flex-col items-center gap-1 flex-1">
            <span className={`text-xl leading-none ${m.metGoal ? "" : "opacity-15 grayscale"}`}>
              {m.metGoal ? "🥇" : "⭕"}
            </span>
            <p className="text-[9px]" style={{ color: FT.textFaint, letterSpacing: 0 }}>
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

  useEffect(() => {
    const s = aiCategorize(vendor);
    setAiSuggestion(s);
    if (s && entryType === "expense") setCategory(s);
  }, [vendor, entryType]);

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
    const entry: PendingEntry = { type: entryType, amount: num, category, description: vendor.trim() || undefined, date };

    setPending(entry);
    setCountdown(3);
    setOpen(false);
    resetForm();

    tickRef.current = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) { if (tickRef.current) clearInterval(tickRef.current); return 0; }
        return p - 1;
      });
    }, 1000);

    saveRef.current = setTimeout(async () => {
      try {
        if (entry.type === "expense") {
          await addExpense.mutateAsync({
            amount: entry.amount, category: entry.category, description: entry.description,
            date: entry.date, expense_type: "variable", is_recurring: false, needs_review: false,
          });
        } else {
          await addIncome.mutateAsync({
            amount: entry.amount, category: entry.category,
            description: entry.description, source: "manual", date: entry.date,
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

  const cats = entryType === "expense" ? DEFAULT_EXPENSE_CATEGORIES : INCOME_SOURCES;

  return (
    <>
      {/* 3-second Undo Banner */}
      {pending && (
        <div
          className="fixed bottom-24 inset-x-4 z-50 rounded-[24px] px-4 py-3 shadow-2xl"
          dir="rtl"
          style={{ background: FT.card, border: `1px solid ${FT.goldBorder}`, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="h-9 w-9 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: pending.type === "expense" ? FT.dangerDim : FT.successDim,
                  border: `1px solid ${pending.type === "expense" ? "rgba(217,107,107,0.3)" : "rgba(124,191,142,0.3)"}`,
                }}
              >
                {pending.type === "expense"
                  ? <Minus className="h-4 w-4" style={{ color: FT.danger }} />
                  : <Plus className="h-4 w-4" style={{ color: FT.success }} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate" style={{ letterSpacing: 0 }}>
                  ₪{fmt(pending.amount)} · {pending.category}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: FT.textMuted }}>
                  {countdown > 0
                    ? `נשמר בעוד ${countdown} ${countdown === 1 ? "שנייה" : "שניות"}`
                    : "שומר..."}
                </p>
              </div>
            </div>
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold active:scale-95 transition-all shrink-0"
              style={{ background: FT.goldDim, color: FT.gold, border: `1px solid ${FT.goldBorder}`, letterSpacing: 0 }}
            >
              <RotateCcw className="h-3 w-3" />
              בטל
            </button>
          </div>
          {/* Gold progress bar draining to zero */}
          <div className="mt-3 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div
              className="h-full rounded-full transition-all ease-linear"
              style={{ width: `${(countdown / 3) * 100}%`, background: FT.gold, transitionDuration: "990ms" }}
            />
          </div>
        </div>
      )}

      {/* Gold FAB */}
      {!open && !pending && (
        <button
          onClick={() => setOpen(true)}
          aria-label="הוסף פעולה פיננסית"
          className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full flex items-center justify-center transition-all active:scale-90 hover:brightness-110"
          style={{
            background: FT.gold,
            color: FT.bg,
            boxShadow: `0 4px 20px ${FT.goldGlow}`,
          }}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

      {/* Quick Add Slide-up Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end" dir="rtl">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="relative w-full max-h-[88vh] overflow-y-auto rounded-t-[32px] px-5 pt-4 pb-10 space-y-4 shadow-2xl"
            style={{ background: FT.bg, borderTop: `1px solid ${FT.goldBorder}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: "rgba(244,226,140,0.2)" }} />

            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-base font-black text-white" style={{ letterSpacing: 0 }}>הוספה מהירה</p>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: FT.goldDim, color: FT.textMuted }}
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
                  className="flex items-center justify-center gap-2 py-3 rounded-[18px] text-sm font-bold transition-all"
                  style={{
                    letterSpacing: 0,
                    background: entryType === t
                      ? t === "expense" ? FT.dangerDim : FT.successDim
                      : FT.brownDim,
                    border: entryType === t
                      ? `1px solid ${t === "expense" ? "rgba(217,107,107,0.35)" : "rgba(124,191,142,0.35)"}`
                      : `1px solid ${FT.brownBorder}`,
                    color: entryType === t
                      ? t === "expense" ? FT.danger : FT.success
                      : FT.textMuted,
                  }}
                >
                  {t === "expense" ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {t === "expense" ? "הוצאה" : "הכנסה"}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="relative">
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xl font-black" style={{ color: FT.textFaint }}>₪</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pe-12 ps-4 py-4 rounded-[18px] text-2xl font-black text-white placeholder:text-white/15 focus:outline-none transition-all"
                style={{
                  background: FT.card,
                  border: `1px solid ${FT.goldBorder}`,
                }}
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
                className="w-full px-4 py-3 rounded-[18px] text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
                style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
              />
              {aiSuggestion && entryType === "expense" && (
                <div className="flex items-center gap-1.5 mt-2 px-1">
                  <Sparkles className="h-3 w-3 shrink-0" style={{ color: FT.gold }} />
                  <p className="text-[11px]" style={{ color: FT.textSub, letterSpacing: 0 }}>
                    AI זיהה: <span className="font-black" style={{ color: FT.gold }}>{aiSuggestion}</span> — נבחר אוטומטית
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
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                  style={{
                    letterSpacing: 0,
                    background: category === cat.name ? FT.goldMid : FT.brownDim,
                    border: `1px solid ${category === cat.name ? FT.goldBorder : FT.brownBorder}`,
                    color: category === cat.name ? FT.gold : FT.textMuted,
                  }}
                >
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!amount}
              className="w-full py-4 rounded-[18px] font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                letterSpacing: 0,
                background: entryType === "expense" ? FT.danger : FT.gold,
                color: entryType === "expense" ? "#fff" : FT.bg,
                boxShadow: entryType === "expense"
                  ? `0 4px 20px ${FT.dangerDim}`
                  : `0 4px 20px ${FT.goldGlow}`,
              }}
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

  const score = computeHealthScore(fin.savingsPct, savingsGoal, fin.balance, fin.forecastBalance, fin.totalIncome);
  const expensePct = fin.forecastExpenses > 0 ? fin.totalExpenses / fin.forecastExpenses : 0;
  const balancePct = fin.totalIncome > 0 ? Math.max(0, fin.balance / fin.totalIncome) : 0;

  return (
    <div className="space-y-4">
      {/* Gold Credit Card — balance hero */}
      <GoldCreditCard
        balance={fin.balance}
        totalIncome={fin.totalIncome}
        totalExpenses={fin.totalExpenses}
        month={month}
        year={year}
      />

      {/* Health Score + Goal Rings */}
      <div
        className="rounded-3xl p-5"
        style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
      >
        <p className="text-[11px] font-bold mb-4" style={{ color: FT.textMuted, letterSpacing: 0 }}>
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

      {/* Medals */}
      <MedalsRow savingsGoal={savingsGoal} />

      {/* Floating Quick Add */}
      <FloatingQuickAdd year={year} month={month} />
    </div>
  );
}
