import { useState, useEffect, useMemo } from "react";
import {
  Plus, ChevronDown, ChevronUp, Trash2,
  Building2, Car, CreditCard, TrendingDown,
  Calendar, Zap, X, Check,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { projectDebt, ILS, type DebtInput } from "@/lib/finance-utils";
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

const TYPE_META: Record<DebtType, { icon: typeof Building2; color: string; glow: string }> = {
  "משכנתא": { icon: Building2, color: "text-sky-400",   glow: "shadow-sky-500/30" },
  "הלוואה": { icon: Car,       color: "text-amber-400", glow: "shadow-amber-500/30" },
  "חוב":    { icon: CreditCard, color: "text-rose-400",  glow: "shadow-rose-500/30" },
};

// ─── LocalStorage persistence ─────────────────────────────────────────────────

const LS_KEY = "finance-debts-v1";

function loadDebts(): Debt[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); }
  catch { return []; }
}

// ─── Simulator ────────────────────────────────────────────────────────────────

function simulateExtra(debt: Debt, extra: number) {
  if (extra <= 0) return null;
  const base = projectDebt(debt);
  const boosted = projectDebt({ ...debt, monthly_payment: debt.monthly_payment + extra });
  return {
    monthsSaved: Math.max(0, base.monthsLeft - boosted.monthsLeft),
    interestSaved: Math.max(0, base.totalInterestRemaining - boosted.totalInterestRemaining),
    newEndDate: boosted.endDate,
    newMonthsLeft: boosted.monthsLeft,
  };
}

// ─── Burn-Down Chart ──────────────────────────────────────────────────────────

function BurnDownChart({ debt, extra }: { debt: Debt; extra: number }) {
  const baseProj = useMemo(() => projectDebt(debt), [debt]);
  const boostProj = useMemo(
    () => extra > 0 ? projectDebt({ ...debt, monthly_payment: debt.monthly_payment + extra }) : null,
    [debt, extra]
  );

  const baseData = useMemo(() => {
    const pts = [{ month: 0, balance: baseProj.remainingBalance, boosted: baseProj.remainingBalance }];
    baseProj.payoffRoadmap.forEach((r) => {
      const boostedPt = boostProj?.payoffRoadmap.find((b) => b.month === r.month);
      pts.push({ month: r.month, balance: r.balance, boosted: boostedPt?.balance ?? r.balance });
    });
    pts.push({ month: baseProj.monthsLeft, balance: 0, boosted: 0 });
    return pts;
  }, [baseProj, boostProj]);

  if (baseData.length < 2) return null;

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={baseData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="boostGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#34d399" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
            tickFormatter={(v) => `${v}מ׳`}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
            tickFormatter={(v) => `₪${fmt(v / 1000)}k`}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(14,19,32,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
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
            type="monotone"
            dataKey="balance"
            stroke="#38bdf8"
            strokeWidth={1.5}
            fill="url(#baseGrad)"
            dot={false}
          />
          {extra > 0 && (
            <Area
              type="monotone"
              dataKey="boosted"
              stroke="#34d399"
              strokeWidth={1.5}
              fill="url(#boostGrad)"
              dot={false}
              strokeDasharray="4 2"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Variable Simulator ───────────────────────────────────────────────────────

function VariableSimulator({ debt }: { debt: Debt }) {
  const [extra, setExtra] = useState("");
  const extraNum = parseFloat(extra) || 0;
  const result = useMemo(() => simulateExtra(debt, extraNum), [debt, extraNum]);

  return (
    <div className="rounded-2xl bg-white/8 border border-emerald-400/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-emerald-400" />
        <p className="text-[11px] font-black text-emerald-400" style={{ letterSpacing: 0 }}>
          סימולטור תשלום נוסף
        </p>
      </div>

      {/* Input */}
      <div className="relative">
        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-white/30 font-black text-sm">₪</span>
        <input
          type="number"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="הזן סכום נוסף לחודש"
          inputMode="numeric"
          className="w-full pe-9 ps-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-sm font-black text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 transition-all"
          dir="ltr"
        />
      </div>

      {/* Results */}
      {result && extraNum > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-2.5 text-center">
            <p className="text-[9px] text-white/40 mb-1" style={{ letterSpacing: 0 }}>ריבית נחסכת</p>
            <p className="text-xs font-black text-emerald-400" dir="ltr">
              ₪{fmt(result.interestSaved)}
            </p>
          </div>
          <div className="rounded-xl bg-sky-500/10 border border-sky-400/20 p-2.5 text-center">
            <p className="text-[9px] text-white/40 mb-1" style={{ letterSpacing: 0 }}>חודשים שנחסכו</p>
            <p className="text-xs font-black text-sky-400">
              {result.monthsSaved}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
            <p className="text-[9px] text-white/40 mb-1" style={{ letterSpacing: 0 }}>סיום חדש</p>
            <p className="text-[10px] font-black text-white/70" style={{ letterSpacing: 0 }}>
              {fmtDate(result.newEndDate)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-white/25 text-center py-1" style={{ letterSpacing: 0 }}>
          הזן סכום נוסף לראות חיסכון בריבית
        </p>
      )}
    </div>
  );
}

// ─── Debt Card ────────────────────────────────────────────────────────────────

function DebtCard({ debt, onDelete }: { debt: Debt; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [extra, setExtraForChart] = useState(0);

  const proj = useMemo(() => projectDebt(debt), [debt]);
  const paidPct = Math.round((1 - proj.remainingBalance / debt.principal) * 100);
  const meta = TYPE_META[debt.type];
  const Icon = meta.icon;

  const yearsLeft = Math.floor(proj.monthsLeft / 12);
  const monthsRem = proj.monthsLeft % 12;

  // Read extra from simulator via state lift — simpler: just re-read on expand
  const [simExtra, setSimExtra] = useState("");
  const simNum = parseFloat(simExtra) || 0;

  return (
    <div
      className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
      dir="rtl"
    >
      {/* Card Header */}
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 bg-white/8 border border-white/10`}
        >
          <Icon className={`h-5 w-5 ${meta.color}`} />
        </div>

        <div className="flex-1 text-right min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-black text-white truncate" style={{ letterSpacing: 0 }}>
              {debt.name}
            </p>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold shrink-0 ${
                debt.type === "משכנתא"
                  ? "border-sky-400/30 bg-sky-400/10 text-sky-400"
                  : debt.type === "הלוואה"
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
                  : "border-rose-400/30 bg-rose-400/10 text-rose-400"
              }`}
              style={{ letterSpacing: 0 }}
            >
              {debt.type}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <span>יתרה: ₪{fmt(proj.remainingBalance)}</span>
            <span>·</span>
            <span>
              {yearsLeft > 0 ? `${yearsLeft} שנים` : ""}
              {monthsRem > 0 ? ` ${monthsRem} חודשים` : ""}
            </span>
          </div>

          {/* Burn-down progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  paidPct >= 75 ? "bg-emerald-400" : paidPct >= 40 ? "bg-sky-400" : "bg-amber-400"
                }`}
                style={{ width: `${paidPct}%` }}
              />
            </div>
            <span className="text-[9px] text-white/30 shrink-0">{paidPct}%</span>
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="h-4 w-4 text-white/30 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/30 shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/8">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-3">
            {[
              { label: "יתרת קרן",       value: `₪${fmt(proj.remainingBalance)}`,      color: "text-rose-400" },
              { label: "סיום צפוי",       value: fmtDate(proj.endDate),                color: "text-sky-400" },
              { label: "ריבית שנותרה",   value: `₪${fmt(proj.totalInterestRemaining)}`, color: "text-amber-400" },
              { label: "עלות כוללת",     value: `₪${fmt(proj.totalCost)}`,             color: "text-white/50" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl bg-white/5 border border-white/8 p-3">
                <p className="text-[9px] text-white/35 mb-1" style={{ letterSpacing: 0 }}>{label}</p>
                <p className={`text-xs font-black ${color} truncate`} dir="ltr">{value}</p>
              </div>
            ))}
          </div>

          {/* Burn-Down Chart */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-white/35" style={{ letterSpacing: 0 }}>
              📉 גרף שחיקת קרן
              {simNum > 0 && <span className="text-emerald-400"> · ירוק = עם תוספת ₪{fmt(simNum)}</span>}
            </p>
            <BurnDownChart debt={debt} extra={simNum} />
          </div>

          {/* Variable Simulator — controls the chart */}
          <div className="rounded-2xl bg-white/8 border border-emerald-400/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <p className="text-[11px] font-black text-emerald-400" style={{ letterSpacing: 0 }}>
                סימולטור תשלום נוסף
              </p>
            </div>

            <div className="relative">
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-white/30 font-black text-sm">₪</span>
              <input
                type="number"
                value={simExtra}
                onChange={(e) => {
                  setSimExtra(e.target.value);
                  setExtraForChart(parseFloat(e.target.value) || 0);
                }}
                placeholder="הזן סכום נוסף לחודש"
                inputMode="numeric"
                className="w-full pe-9 ps-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-sm font-black text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 transition-all"
                dir="ltr"
              />
            </div>

            {simNum > 0 ? (() => {
              const r = simulateExtra(debt, simNum);
              if (!r) return null;
              return (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "ריבית נחסכת",  value: `₪${fmt(r.interestSaved)}`,  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-400/20" },
                    { label: "חודשים חסכת", value: String(r.monthsSaved),        color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-400/20" },
                    { label: "סיום חדש",     value: fmtDate(r.newEndDate),       color: "text-white/70",    bg: "bg-white/5 border-white/10" },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`rounded-xl border p-2.5 text-center ${bg}`}>
                      <p className="text-[9px] text-white/40 mb-1" style={{ letterSpacing: 0 }}>{label}</p>
                      <p className={`text-xs font-black ${color} truncate`}>{value}</p>
                    </div>
                  ))}
                </div>
              );
            })() : (
              <p className="text-[11px] text-white/25 text-center py-1" style={{ letterSpacing: 0 }}>
                הזן סכום נוסף לחישוב חיסכון בריבית בזמן אמת
              </p>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-[11px] text-white/25 hover:text-rose-400 transition-colors"
            style={{ letterSpacing: 0 }}
          >
            <Trash2 className="h-3 w-3" />
            מחק חוב זה
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add Debt Form ────────────────────────────────────────────────────────────

const DEBT_TYPES: DebtType[] = ["משכנתא", "הלוואה", "חוב"];

function AddDebtForm({ onAdd, onCancel }: { onAdd: (d: Debt) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("הלוואה");
  const [principal, setPrincipal] = useState("");
  const [monthly, setMonthly] = useState("");
  const [rate, setRate] = useState("");
  const [elapsed, setElapsed] = useState("0");

  function handleAdd() {
    if (!name.trim() || !principal || !monthly || !rate) {
      toast.error("מלא את כל השדות"); return;
    }
    const p = parseFloat(principal), m = parseFloat(monthly), r = parseFloat(rate);
    if (!p || !m || !r) { toast.error("ערכים לא תקינים"); return; }
    if (m <= p * (r / 100 / 12)) { toast.error("התשלום החודשי נמוך מדי לכסות ריבית"); return; }

    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      principal: p,
      monthly_payment: m,
      annual_interest_rate: r,
      months_elapsed: parseInt(elapsed) || 0,
    });
  }

  const fields = [
    { label: "קרן מקורית (₪)",        val: principal, set: setPrincipal, placeholder: "500000" },
    { label: "תשלום חודשי (₪)",       val: monthly,   set: setMonthly,   placeholder: "3500"  },
    { label: "ריבית שנתית (%)",        val: rate,      set: setRate,      placeholder: "4.5"   },
    { label: "חודשים ששולמו כבר",      val: elapsed,   set: setElapsed,   placeholder: "0"     },
  ];

  return (
    <div className="rounded-2xl bg-white/8 border border-sky-400/20 p-4 space-y-3" dir="rtl">
      <p className="text-[11px] font-black text-sky-400" style={{ letterSpacing: 0 }}>
        הוספת חוב / משכנתא
      </p>

      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="שם (משכנתא בנק לאומי, הלוואת רכב...)"
        className="w-full px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sky-500/40 transition-all"
      />

      {/* Type */}
      <div className="flex gap-2">
        {DEBT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
              type === t
                ? "border-sky-400/50 bg-sky-400/15 text-sky-300"
                : "border-white/10 bg-white/5 text-white/40"
            }`}
            style={{ letterSpacing: 0 }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Numeric fields */}
      <div className="grid grid-cols-2 gap-2">
        {fields.map(({ label, val, set, placeholder }) => (
          <div key={label}>
            <p className="text-[10px] text-white/35 mb-1" style={{ letterSpacing: 0 }}>{label}</p>
            <input
              type="number"
              value={val}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              inputMode="decimal"
              className="w-full px-3 py-2 rounded-xl bg-white/8 border border-white/10 text-sm font-black text-white placeholder:text-white/20 focus:outline-none focus:border-sky-500/40 transition-all"
              dir="ltr"
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/50 hover:text-white transition-colors"
          style={{ letterSpacing: 0 }}
        >
          ביטול
        </button>
        <button
          onClick={handleAdd}
          className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white text-xs font-black shadow-lg shadow-sky-500/30 hover:bg-sky-400 active:scale-[0.98] transition-all"
          style={{ letterSpacing: 0 }}
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

// ─── Summary Card ─────────────────────────────────────────────────────────────

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
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 space-y-1">
        <p className="text-[10px] text-white/40" style={{ letterSpacing: 0 }}>יתרה כוללת</p>
        <p className="text-sm font-black text-rose-400" dir="ltr">₪{fmt(totals.remainingBalance)}</p>
      </div>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 space-y-1">
        <p className="text-[10px] text-white/40" style={{ letterSpacing: 0 }}>ריבית נותרת</p>
        <p className="text-sm font-black text-amber-400" dir="ltr">₪{fmt(totals.totalInterest)}</p>
      </div>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 space-y-1">
        <p className="text-[10px] text-white/40" style={{ letterSpacing: 0 }}>עלות כוללת</p>
        <p className="text-sm font-black text-white/60" dir="ltr">₪{fmt(totals.totalCost)}</p>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function FinanceDebtsTab(_: { year: number; month: number }) {
  const [debts, setDebts] = useState<Debt[]>(loadDebts);
  const [showForm, setShowForm] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(debts));
  }, [debts]);

  function handleAdd(debt: Debt) {
    setDebts((prev) => [...prev, debt]);
    setShowForm(false);
    toast.success(`"${debt.name}" נוסף`);
  }

  function handleDelete(id: string) {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    toast.success("חוב נמחק");
  }

  return (
    <div className="space-y-4" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-white/50" style={{ letterSpacing: 0 }}>
          🏦 חובות והלוואות
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-400 text-xs font-black hover:bg-sky-500/25 active:scale-95 transition-all"
          style={{ letterSpacing: 0 }}
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? "סגור" : "הוסף"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <AddDebtForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {/* Summary (only with debts) */}
      {debts.length > 1 && <DebtsSummary debts={debts} />}

      {/* Debt Cards */}
      {debts.length === 0 && !showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-3xl border-2 border-dashed border-white/10 p-8 text-center hover:border-sky-400/30 hover:bg-white/5 transition-all group"
        >
          <Building2 className="h-8 w-8 text-white/15 group-hover:text-sky-400/40 mx-auto mb-3 transition-colors" />
          <p className="text-sm font-bold text-white/25 group-hover:text-white/50 transition-colors" style={{ letterSpacing: 0 }}>
            הוסף משכנתא, הלוואה או חוב
          </p>
          <p className="text-[11px] text-white/15 mt-1" style={{ letterSpacing: 0 }}>
            תקבל גרף שחיקה + סימולטור ריבית
          </p>
        </button>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onDelete={() => handleDelete(debt.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
