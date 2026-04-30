import { useState, useEffect, useMemo } from "react";
import {
  Plus, ChevronDown, ChevronUp, Trash2,
  Building2, Car, CreditCard, Zap, X, Check,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { projectDebt, type DebtInput } from "@/lib/finance-utils";
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

// Earthy debt type palette
const TYPE_META: Record<DebtType, { icon: typeof Building2; color: string; dimBg: string; border: string }> = {
  "משכנתא": { icon: Building2,  color: FT.gold,    dimBg: FT.goldDim,   border: FT.goldBorder },
  "הלוואה": { icon: Car,        color: FT.brown,   dimBg: FT.brownDim,  border: FT.brownBorder },
  "חוב":    { icon: CreditCard, color: FT.danger,  dimBg: FT.dangerDim, border: "rgba(217,107,107,0.25)" },
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
  const simNum = parseFloat(simExtra) || 0;

  const proj = useMemo(() => projectDebt(debt), [debt]);
  const paidPct = Math.round((1 - proj.remainingBalance / debt.principal) * 100);
  const meta = TYPE_META[debt.type];
  const Icon = meta.icon;
  const yearsLeft = Math.floor(proj.monthsLeft / 12);
  const monthsRem = proj.monthsLeft % 12;

  const barColor = paidPct >= 75 ? FT.gold : paidPct >= 40 ? FT.brown : FT.danger;

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
      dir="rtl"
    >
      {/* Card Header */}
      <button
        className="w-full flex items-center gap-3 p-4 transition-colors"
        style={{ background: "transparent" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: meta.dimBg, border: `1px solid ${meta.border}` }}
        >
          <Icon className="h-5 w-5" style={{ color: meta.color }} />
        </div>

        <div className="flex-1 text-right min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-black text-white truncate" style={{ letterSpacing: 0 }}>
              {debt.name}
            </p>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
              style={{
                background: meta.dimBg,
                border: `1px solid ${meta.border}`,
                color: meta.color,
                letterSpacing: 0,
              }}
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
        </div>

        {expanded
          ? <ChevronUp  className="h-4 w-4 shrink-0" style={{ color: FT.textMuted }} />
          : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: FT.textMuted }} />}
      </button>

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

          {/* Delete */}
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-[11px] transition-colors"
            style={{ color: FT.textFaint, letterSpacing: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = FT.danger)}
            onMouseLeave={(e) => (e.currentTarget.style.color = FT.textFaint)}
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
    if (!name.trim() || !principal || !monthly || !rate) { toast.error("מלא את כל השדות"); return; }
    const p = parseFloat(principal), m = parseFloat(monthly), r = parseFloat(rate);
    if (!p || !m || !r) { toast.error("ערכים לא תקינים"); return; }
    if (m <= p * (r / 100 / 12)) { toast.error("התשלום החודשי נמוך מדי לכסות ריבית"); return; }
    onAdd({ id: crypto.randomUUID(), name: name.trim(), type, principal: p, monthly_payment: m, annual_interest_rate: r, months_elapsed: parseInt(elapsed) || 0 });
  }

  const fields = [
    { label: "קרן מקורית (₪)",      val: principal, set: setPrincipal, placeholder: "500000" },
    { label: "תשלום חודשי (₪)",     val: monthly,   set: setMonthly,   placeholder: "3500"   },
    { label: "ריבית שנתית (%)",      val: rate,      set: setRate,      placeholder: "4.5"    },
    { label: "חודשים ששולמו כבר",    val: elapsed,   set: setElapsed,   placeholder: "0"      },
  ];

  const subInput = { background: FT.card, border: `1px solid ${FT.goldBorder}` } as const;

  return (
    <div className="rounded-2xl p-4 space-y-3" dir="rtl"
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
          const m = TYPE_META[t];
          const active = type === t;
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                letterSpacing: 0,
                background: active ? m.dimBg : FT.brownDim,
                border: `1px solid ${active ? m.border : FT.brownBorder}`,
                color: active ? m.color : FT.textMuted,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Numeric fields */}
      <div className="grid grid-cols-2 gap-2">
        {fields.map(({ label, val, set, placeholder }) => (
          <div key={label}>
            <p className="text-[10px] mb-1" style={{ color: FT.textFaint, letterSpacing: 0 }}>{label}</p>
            <input
              type="number" value={val} onChange={(e) => set(e.target.value)}
              placeholder={placeholder} inputMode="decimal"
              className="w-full px-3 py-2 rounded-xl text-sm font-black text-white placeholder:text-white/15 focus:outline-none transition-all"
              style={subInput} dir="ltr"
            />
          </div>
        ))}
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
  const [debts, setDebts] = useState<Debt[]>(loadDebts);
  const [showForm, setShowForm] = useState(false);

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
        </div>
      )}
    </div>
  );
}
