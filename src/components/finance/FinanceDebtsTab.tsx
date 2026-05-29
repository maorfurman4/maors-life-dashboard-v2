import { useState, useMemo } from "react";
import {
  Plus, ChevronDown, ChevronUp, Trash2,
  Building2, Car, CreditCard, Zap, X, Check,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { projectDebt, calcMonthlyPayment, calcMonthsToPayoff, type DebtInput } from "@/lib/finance-utils";
import { useDebts, useAddDebt, useDeleteDebt } from "@/hooks/use-finance-data";
import { FT } from "@/lib/finance-theme";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("he-IL", { month: "long", year: "numeric" });

// ─── Types ────────────────────────────────────────────────────────────────────

type DebtType = "משכנתא" | "הלוואה" | "חוב";

interface Debt extends DebtInput {
  id: string;
  name: string;
  type: DebtType;
}

// Debt type palette with richer colors
const TYPE_META: Record<DebtType, { icon: typeof Building2; color: string; dimBg: string; border: string; bgClass: string; borderClass: string; badgeClass: string; barColor: string }> = {
  "משכנתא": {
    icon: Building2,
    color: "#3b82f6",
    dimBg: "rgba(59,130,246,0.15)",
    border: "rgba(59,130,246,0.4)",
    bgClass: "bg-gradient-to-br from-blue-500/10 to-indigo-500/10",
    borderClass: "border-blue-500/40",
    badgeClass: "border border-blue-500/40 bg-blue-500/10 text-blue-300",
    barColor: "#3b82f6",
  },
  "הלוואה": {
    icon: Car,
    color: "#10b981",
    dimBg: "rgba(16,185,129,0.15)",
    border: "rgba(16,185,129,0.4)",
    bgClass: "bg-gradient-to-br from-emerald-500/10 to-teal-500/10",
    borderClass: "border-emerald-500/40",
    badgeClass: "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    barColor: "#10b981",
  },
  "חוב": {
    icon: CreditCard,
    color: "#f43f5e",
    dimBg: "rgba(244,63,94,0.15)",
    border: "rgba(244,63,94,0.4)",
    bgClass: "bg-gradient-to-br from-rose-500/10 to-red-500/10",
    borderClass: "border-rose-500/40",
    badgeClass: "border border-rose-500/40 bg-rose-500/10 text-rose-300",
    barColor: "#f43f5e",
  },
};

// ─── LocalStorage persistence ─────────────────────────────────────────────────

const LS_KEY = "finance-debts-v1";
function loadDebts(): Debt[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); }
  catch { return []; }
}

// ─── Simulator helper ─────────────────────────────────────────────────────────

function simulateExtra(debt: Debt, extra: number) {
  if (extra <= 0) return null;
  const base = projectDebt(debt);
  const boosted = projectDebt({ ...debt, monthly_payment: debt.monthly_payment + extra });
  return {
    monthsSaved: Math.max(0, base.monthsLeft - boosted.monthsLeft),
    interestSaved: Math.max(0, base.totalInterestRemaining - boosted.totalInterestRemaining),
    newEndDate: boosted.endDate,
  };
}

// ─── Burn-Down Chart — earthy palette ────────────────────────────────────────

function BurnDownChart({ debt, extra }: { debt: Debt; extra: number }) {
  const baseProj = useMemo(() => projectDebt(debt), [debt]);
  const boostProj = useMemo(
    () => extra > 0 ? projectDebt({ ...debt, monthly_payment: debt.monthly_payment + extra }) : null,
    [debt, extra]
  );

  const chartData = useMemo(() => {
    const pts = [{ month: 0, balance: baseProj.remainingBalance, boosted: baseProj.remainingBalance }];
    baseProj.payoffRoadmap.forEach((r) => {
      const bp = boostProj?.payoffRoadmap.find((b) => b.month === r.month);
      pts.push({ month: r.month, balance: r.balance, boosted: bp?.balance ?? r.balance });
    });
    pts.push({ month: baseProj.monthsLeft, balance: 0, boosted: 0 });
    return pts;
  }, [baseProj, boostProj]);

  if (chartData.length < 2) return null;

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="debtBaseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={FT.brown} stopOpacity={0.30} />
              <stop offset="95%" stopColor={FT.brown} stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="debtBoostGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={FT.gold} stopOpacity={0.35} />
              <stop offset="95%" stopColor={FT.gold} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 9, fill: FT.textFaint }}
            tickFormatter={(v) => `${v}מ׳`}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: FT.textFaint }}
            tickFormatter={(v) => `₪${fmt(v / 1000)}k`}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: FT.card,
              border: `1px solid ${FT.goldBorder}`,
              borderRadius: 12,
              fontSize: 11,
              color: "#fff",
            }}
            formatter={(v: number, name: string) => [
              `₪${fmt(v)}`,
              name === "balance" ? "יתרה רגילה" : "יתרה עם תוספת",
            ]}
            labelFormatter={(l) => `חודש ${l}`}
          />
          <Area
            type="monotone" dataKey="balance"
            stroke={FT.brown} strokeWidth={1.5}
            fill="url(#debtBaseGrad)" dot={false}
          />
          {extra > 0 && (
            <Area
              type="monotone" dataKey="boosted"
              stroke={FT.gold} strokeWidth={1.5}
              fill="url(#debtBoostGrad)" dot={false}
              strokeDasharray="4 2"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Debt Card ────────────────────────────────────────────────────────────────

function DebtCard({ debt, onDelete }: { debt: Debt; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [simExtra, setSimExtra] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const simNum = parseFloat(simExtra) || 0;

  const proj = useMemo(() => projectDebt(debt), [debt]);
  const paidPct = debt.principal > 0
    ? Math.max(0, Math.min(100, Math.round((1 - proj.remainingBalance / debt.principal) * 100)))
    : 0;
  const meta = TYPE_META[debt.type];
  const Icon = meta.icon;
  const yearsLeft = Math.floor(proj.monthsLeft / 12);
  const monthsRem = proj.monthsLeft % 12;

  const barColor = meta.barColor;

  return (
    <div
      className={`rounded-3xl overflow-hidden border ${meta.borderClass} ${meta.bgClass}`}
      style={{ background: FT.card }}
    >
      {/* Card Header */}
      <div className="flex items-center gap-2 p-4">
        {/* Type icon */}
        <div
          className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: meta.dimBg, border: `1px solid ${meta.border}` }}
        >
          <Icon className="h-5 w-5" style={{ color: meta.color }} />
        </div>

        {/* Info — tappable to expand */}
        <button
          className="flex-1 text-end min-w-0"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-black text-white truncate" style={{ letterSpacing: 0 }}>
              {debt.name}
            </p>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${meta.badgeClass}`}
              style={{ letterSpacing: 0 }}
            >
              {debt.type}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: FT.textMuted }}>
            <span>יתרה: ₪{fmt(proj.remainingBalance)}</span>
            <span>·</span>
            <span>
              {yearsLeft > 0 ? `${yearsLeft} שנים` : ""}
              {monthsRem > 0 ? ` ${monthsRem} חודשים` : ""}
            </span>
          </div>
          {/* Burn-down progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${paidPct}%`, background: barColor }}
              />
            </div>
            <span className="text-[9px] shrink-0" style={{ color: FT.textFaint }}>{paidPct}%</span>
          </div>
        </button>

        {/* Right side: delete + expand */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onDelete}
                className="h-7 w-7 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                style={{ background: FT.dangerDim, color: FT.danger }}
                aria-label="אשר מחיקה"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                style={{ background: FT.brownDim, color: FT.textMuted }}
                aria-label="ביטול"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="h-7 w-7 rounded-lg flex items-center justify-center active:scale-90 transition-all"
              style={{ background: FT.dangerDim, color: FT.danger }}
              aria-label="מחק חוב"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => setExpanded((v) => !v)} style={{ color: FT.textMuted }}>
            {expanded
              ? <ChevronUp  className="h-4 w-4" />
              : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${FT.goldBorder}` }}>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-3">
            {[
              { label: "יתרת קרן",       value: `₪${fmt(proj.remainingBalance)}`,       color: FT.danger },
              { label: "סיום צפוי",       value: fmtDate(proj.endDate),                 color: FT.brown  },
              { label: "ריבית שנותרה",   value: `₪${fmt(proj.totalInterestRemaining)}`, color: FT.gold   },
              { label: "עלות כוללת",     value: `₪${fmt(proj.totalCost)}`,              color: FT.textMuted },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-2xl p-3"
                style={{ background: FT.cardLight, border: `1px solid ${FT.brownBorder}` }}
              >
                <p className="text-[9px] mb-1" style={{ color: FT.textFaint, letterSpacing: 0 }}>{label}</p>
                <p className="text-xs font-black truncate" style={{ color }} dir="ltr">{value}</p>
              </div>
            ))}
          </div>

          {/* Burn-Down Chart */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold" style={{ color: FT.textMuted, letterSpacing: 0 }}>
              📉 גרף שחיקת קרן
              {simNum > 0 && (
                <span style={{ color: FT.gold }}> · זהב = עם תוספת ₪{fmt(simNum)}</span>
              )}
            </p>
            <BurnDownChart debt={debt} extra={simNum} />
          </div>

          {/* Variable Simulator */}
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: FT.cardLight, border: `1px solid ${FT.goldBorder}` }}
          >
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" style={{ color: FT.gold }} />
              <p className="text-[11px] font-black" style={{ color: FT.gold, letterSpacing: 0 }}>
                סימולטור תשלום נוסף
              </p>
            </div>

            <div className="relative">
              <span className="absolute end-3 top-1/2 -translate-y-1/2 font-black text-sm" style={{ color: FT.textFaint }}>₪</span>
              <input
                type="number"
                value={simExtra}
                onChange={(e) => setSimExtra(e.target.value)}
                placeholder="הזן סכום נוסף לחודש"
                inputMode="numeric"
                className="w-full pe-9 ps-4 py-2.5 rounded-xl text-sm font-black text-white placeholder:text-white/20 focus:outline-none transition-all"
                style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
                dir="ltr"
              />
            </div>

            {simNum > 0 ? (() => {
              const r = simulateExtra(debt, simNum);
              if (!r) return null;
              return (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "ריבית נחסכת",  value: `₪${fmt(r.interestSaved)}`, color: FT.gold,    bg: FT.goldDim,    border: FT.goldBorder },
                    { label: "חודשים חסכת", value: String(r.monthsSaved),       color: FT.success,  bg: FT.successDim, border: "rgba(124,191,142,0.25)" },
                    { label: "סיום חדש",     value: fmtDate(r.newEndDate),      color: FT.textMuted,bg: FT.brownDim,   border: FT.brownBorder },
                  ].map(({ label, value, color, bg, border }) => (
                    <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: bg, border: `1px solid ${border}` }}>
                      <p className="text-[9px] mb-1" style={{ color: FT.textFaint, letterSpacing: 0 }}>{label}</p>
                      <p className="text-xs font-black truncate" style={{ color, letterSpacing: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
              );
            })() : (
              <p className="text-[11px] text-center py-1" style={{ color: FT.textFaint, letterSpacing: 0 }}>
                הזן סכום נוסף לחישוב חיסכון בריבית בזמן אמת
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Add Debt Form ────────────────────────────────────────────────────────────

const DEBT_TYPES: DebtType[] = ["משכנתא", "הלוואה", "חוב"];

function AddDebtForm({ onAdd, onCancel }: { onAdd: (d: Omit<Debt, "id">) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("הלוואה");
  const [principal, setPrincipal] = useState("");
  const [monthly, setMonthly] = useState("");
  const [rate, setRate] = useState("");
  const [elapsed, setElapsed] = useState("0");
  const [calcMode, setCalcMode] = useState<"payment" | "months">("payment");
  const [inputMonths, setInputMonths] = useState("");

  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) || 0;
  const m = parseFloat(monthly) || 0;
  const mo = parseInt(inputMonths) || 0;

  const computedMonths = calcMode === "payment" && p > 0 && m > 0 ? calcMonthsToPayoff(p, r, m) : null;
  const computedPayment = calcMode === "months" && p > 0 && mo > 0 ? calcMonthlyPayment(p, r, mo) : null;

  function handleAdd() {
    const finalMonthly = calcMode === "months" ? (computedPayment ?? 0) : m;
    if (!name.trim() || !principal || !rate || (calcMode === "payment" ? !monthly : !inputMonths)) {
      toast.error("מלא את כל השדות"); return;
    }
    if (!p || !finalMonthly || !r) { toast.error("ערכים לא תקינים"); return; }
    if (finalMonthly <= p * (r / 100 / 12)) { toast.error("התשלום החודשי נמוך מדי לכסות ריבית"); return; }
    onAdd({ name: name.trim(), type, principal: p, monthly_payment: finalMonthly, annual_interest_rate: r, months_elapsed: parseInt(elapsed) || 0 });
  }

  const subInput = { background: FT.card, border: `1px solid ${FT.goldBorder}` } as const;

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: FT.cardLight, border: `1px solid ${FT.goldBorder}` }}>
      <p className="text-[11px] font-black" style={{ color: FT.textSub, letterSpacing: 0 }}>
        הוספת חוב / משכנתא
      </p>

      {/* Name */}
      <input
        type="text" value={name} onChange={(e) => setName(e.target.value)}
        placeholder="שם (משכנתא בנק לאומי, הלוואת רכב...)"
        className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
        style={subInput}
      />

      {/* Type toggle */}
      <div className="flex gap-2">
        {DEBT_TYPES.map((t) => {
          const mt = TYPE_META[t];
          const active = type === t;
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                letterSpacing: 0,
                background: active ? mt.dimBg : FT.brownDim,
                border: `1px solid ${active ? mt.border : FT.brownBorder}`,
                color: active ? mt.color : FT.textMuted,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Principal + Rate */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] mb-1" style={{ color: FT.textFaint, letterSpacing: 0 }}>קרן מקורית (₪)</p>
          <input
            type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)}
            placeholder="500000" inputMode="decimal"
            className="w-full px-3 py-2 rounded-xl text-sm font-black text-white placeholder:text-white/15 focus:outline-none transition-all"
            style={subInput} dir="ltr"
          />
        </div>
        <div>
          <p className="text-[10px] mb-1" style={{ color: FT.textFaint, letterSpacing: 0 }}>ריבית שנתית (%)</p>
          <input
            type="number" value={rate} onChange={(e) => setRate(e.target.value)}
            placeholder="4.5" inputMode="decimal"
            className="w-full px-3 py-2 rounded-xl text-sm font-black text-white placeholder:text-white/15 focus:outline-none transition-all"
            style={subInput} dir="ltr"
          />
        </div>
      </div>

      {/* Calc mode toggle */}
      <div className="flex gap-2">
        {(["payment", "months"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setCalcMode(mode)}
            className="flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all"
            style={{
              letterSpacing: 0,
              background: calcMode === mode ? FT.goldMid : FT.brownDim,
              border: `1px solid ${calcMode === mode ? FT.goldBorder : FT.brownBorder}`,
              color: calcMode === mode ? FT.gold : FT.textMuted,
            }}
          >
            {mode === "payment" ? "אני יודע את התשלום החודשי" : "אני רוצה לסיים בתוך X חודשים"}
          </button>
        ))}
      </div>

      {/* Payment or Months input with live preview */}
      {calcMode === "payment" ? (
        <div>
          <p className="text-[10px] mb-1" style={{ color: FT.textFaint, letterSpacing: 0 }}>תשלום חודשי (₪)</p>
          <input
            type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)}
            placeholder="3500" inputMode="decimal"
            className="w-full px-3 py-2 rounded-xl text-sm font-black text-white placeholder:text-white/15 focus:outline-none transition-all"
            style={subInput} dir="ltr"
          />
          {computedMonths !== null && isFinite(computedMonths) && (
            <p className="text-[11px] mt-1.5 font-bold" style={{ color: FT.gold, letterSpacing: 0 }}>
              משך ההחזר: {computedMonths} חודשים ({Math.floor(computedMonths / 12)} שנים{computedMonths % 12 > 0 ? ` ו-${computedMonths % 12} חודשים` : ""})
            </p>
          )}
          {computedMonths !== null && !isFinite(computedMonths) && (
            <p className="text-[11px] mt-1.5" style={{ color: FT.danger, letterSpacing: 0 }}>
              התשלום נמוך מדי לכסות ריבית
            </p>
          )}
        </div>
      ) : (
        <div>
          <p className="text-[10px] mb-1" style={{ color: FT.textFaint, letterSpacing: 0 }}>כמה חודשים לסיום</p>
          <input
            type="number" value={inputMonths} onChange={(e) => setInputMonths(e.target.value)}
            placeholder="120" inputMode="numeric"
            className="w-full px-3 py-2 rounded-xl text-sm font-black text-white placeholder:text-white/15 focus:outline-none transition-all"
            style={subInput} dir="ltr"
          />
          {computedPayment !== null && computedPayment > 0 && (
            <p className="text-[11px] mt-1.5 font-bold" style={{ color: FT.gold, letterSpacing: 0 }}>
              תשלום חודשי: ₪{fmt(Math.round(computedPayment))}
            </p>
          )}
        </div>
      )}

      {/* Elapsed months */}
      <div>
        <p className="text-[10px] mb-1" style={{ color: FT.textFaint, letterSpacing: 0 }}>חודשים ששולמו כבר</p>
        <input
          type="number" value={elapsed} onChange={(e) => setElapsed(e.target.value)}
          placeholder="0" inputMode="numeric"
          className="w-full px-3 py-2 rounded-xl text-sm font-black text-white placeholder:text-white/15 focus:outline-none transition-all"
          style={subInput} dir="ltr"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors"
          style={{ background: FT.brownDim, border: `1px solid ${FT.brownBorder}`, color: FT.textMuted, letterSpacing: 0 }}
        >
          ביטול
        </button>
        <button
          onClick={handleAdd}
          className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all active:scale-[0.98]"
          style={{
            letterSpacing: 0,
            background: FT.gold,
            color: FT.bg,
            boxShadow: `0 4px 16px ${FT.goldGlow}`,
          }}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            הוסף וחשב
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Debts Summary ────────────────────────────────────────────────────────────

function DebtsSummary({ debts }: { debts: Debt[] }) {
  const totals = useMemo(() => {
    let remainingBalance = 0, totalInterest = 0, totalCost = 0;
    debts.forEach((d) => {
      const p = projectDebt(d);
      remainingBalance += p.remainingBalance;
      totalInterest += p.totalInterestRemaining;
      totalCost += p.totalCost;
    });
    return { remainingBalance, totalInterest, totalCost };
  }, [debts]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "יתרה כוללת",  value: `₪${fmt(totals.remainingBalance)}`, color: FT.danger  },
        { label: "ריבית נותרת", value: `₪${fmt(totals.totalInterest)}`,    color: FT.brown   },
        { label: "עלות כוללת",  value: `₪${fmt(totals.totalCost)}`,        color: FT.textMuted },
      ].map(({ label, value, color }) => (
        <div key={label} className="rounded-2xl p-3 space-y-1"
          style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}>
          <p className="text-[10px]" style={{ color: FT.textFaint, letterSpacing: 0 }}>{label}</p>
          <p className="text-sm font-black" style={{ color }} dir="ltr">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function FinanceDebtsTab(_: { year: number; month: number }) {
  const { data: debtsData, isLoading } = useDebts();
  const addDebt = useAddDebt();
  const deleteDebt = useDeleteDebt();
  const [showForm, setShowForm] = useState(false);

  const debts = useMemo(() => (debtsData || []) as unknown as Debt[], [debtsData]);

  function handleAdd(debt: Omit<Debt, "id">) {
    addDebt.mutate(
      { name: debt.name, type: debt.type, principal: debt.principal, monthly_payment: debt.monthly_payment, annual_interest_rate: debt.annual_interest_rate, months_elapsed: debt.months_elapsed },
      {
        onSuccess: () => { toast.success(`"${debt.name}" נוסף`); setShowForm(false); },
        onError: (e) => toast.error("שגיאה: " + (e as Error).message),
      }
    );
  }

  function handleDelete(id: string) {
    deleteDebt.mutate(id, {
      onSuccess: () => toast.success("חוב נמחק"),
      onError: (e) => toast.error("שגיאה: " + (e as Error).message),
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-black" style={{ color: FT.textMuted, letterSpacing: 0 }}>
          🏦 חובות והלוואות
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95"
          style={{
            letterSpacing: 0,
            background: FT.goldDim,
            border: `1px solid ${FT.goldBorder}`,
            color: FT.gold,
          }}
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? "סגור" : "הוסף"}
        </button>
      </div>

      {showForm && <AddDebtForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${FT.goldBorder} ${FT.goldBorder} ${FT.goldBorder} ${FT.gold}` }} />
        </div>
      ) : (
        <>
          {debts.length > 1 && <DebtsSummary debts={debts} />}

          {debts.length === 0 && !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-3xl border-2 border-dashed p-8 text-center transition-all group"
              style={{ borderColor: FT.goldBorder }}
            >
              <Building2
                className="h-8 w-8 mx-auto mb-3 transition-colors"
                style={{ color: FT.textFaint }}
              />
              <p className="text-sm font-bold transition-colors" style={{ color: FT.textMuted, letterSpacing: 0 }}>
                הוסף משכנתא, הלוואה או חוב
              </p>
              <p className="text-[11px] mt-1" style={{ color: FT.textFaint, letterSpacing: 0 }}>
                תקבל גרף שחיקה + סימולטור ריבית
              </p>
            </button>
          ) : (
            <div className="space-y-3">
              {debts.map((debt) => (
                <DebtCard key={debt.id} debt={debt} onDelete={() => handleDelete(debt.id)} />
              ))}
              {debts.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium" style={{ color: FT.textMuted, letterSpacing: 0 }}>💡 טיפים פיננסיים</h4>
                  {debts.flatMap((debt) => {
                    const meta = TYPE_META[debt.type];
                    const safeRate = Number(debt.annual_interest_rate) || 0;
                    const safePayment = Number(debt.monthly_payment) || 0;
                    const currentProj = projectDebt(debt);
                    const currentBalance = currentProj.remainingBalance;
                    const tips: { emoji: string; text: string; isWarning: boolean }[] = [];

                    if (safeRate > 5) {
                      const monthlyInterest = currentBalance * safeRate / 100 / 12;
                      const annualInterest = monthlyInterest * 12;
                      tips.push({
                        emoji: "⚠️",
                        text: `ב${debt.name} אתה משלם ~₪${fmt(Math.round(monthlyInterest))} ריבית בחודש (₪${fmt(Math.round(annualInterest))} בשנה). שקול מחזור הלוואה.`,
                        isWarning: true,
                      });
                    }

                    const extraPayment = 500;
                    const baseProj = projectDebt(debt);
                    const boostedProj = projectDebt({ ...debt, monthly_payment: safePayment + extraPayment });
                    const monthsSaved = Math.max(0, baseProj.monthsLeft - boostedProj.monthsLeft);
                    const interestSaved = Math.max(0, baseProj.totalInterestRemaining - boostedProj.totalInterestRemaining);
                    if (isFinite(baseProj.monthsLeft) && isFinite(boostedProj.monthsLeft) && monthsSaved > 2) {
                      tips.push({
                        emoji: "💡",
                        text: `תשלום נוסף של ₪${extraPayment}/חודש ב${debt.name} יחסוך ${monthsSaved} חודשים ו-₪${fmt(Math.round(interestSaved))} ריבית.`,
                        isWarning: false,
                      });
                    }

                    return tips.map((tip, i) => (
                      <div
                        key={`${debt.id}-${i}`}
                        className={`rounded-xl px-3 py-2.5 border ${meta.borderClass} ${meta.bgClass}`}
                        style={{ letterSpacing: 0 }}
                      >
                        <p className="text-xs leading-relaxed" style={{ color: tip.isWarning ? meta.color : FT.textMuted }}>
                          <span className="me-1">{tip.emoji}</span>
                          {tip.text}
                        </p>
                      </div>
                    ));
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
