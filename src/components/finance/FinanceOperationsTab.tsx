import { useState, useEffect, useRef } from "react";
import {
  Plus, Minus, Check, ChevronDown, ChevronUp,
  Trash2, RefreshCw, CreditCard,
} from "lucide-react";
import {
  useAddExpense,
  useAddIncome,
  useFixedExpenses,
  useAddFixedExpense,
  useUpdateFixedExpense,
  useDeleteFixedExpense,
  DEFAULT_EXPENSE_CATEGORIES,
} from "@/hooks/use-finance-data";
import { FT } from "@/lib/finance-theme";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

// ─── Installment helpers ──────────────────────────────────────────────────────

interface InstallMeta { t: number; s: string; }

function parseInstallMeta(notes: string | null): InstallMeta | null {
  if (!notes || !notes.startsWith("{")) return null;
  try {
    const m = JSON.parse(notes);
    if (typeof m.t === "number" && typeof m.s === "string") return m;
    return null;
  } catch { return null; }
}

function installProgress(meta: InstallMeta, year: number, month: number) {
  const [sy, sm] = meta.s.split("-").map(Number);
  const elapsed = (year - sy) * 12 + (month - sm);
  const current = elapsed + 1;
  return {
    current: Math.max(1, Math.min(current, meta.t)),
    total: meta.t,
    active: current >= 1 && current <= meta.t,
    remaining: Math.max(0, meta.t - Math.max(1, current)),
  };
}

// ─── Income categories ────────────────────────────────────────────────────────

const INCOME_CATS: { name: string; icon: string }[] = [
  { name: "משכורת", icon: "💼" },
  { name: "פרילנס", icon: "💻" },
  { name: "שיעורים", icon: "📚" },
  { name: "העברה", icon: "💳" },
  { name: "אחר", icon: "💰" },
];

// ─── Shared input style helpers ───────────────────────────────────────────────

const inputCls = "w-full px-4 py-3 rounded-[16px] text-sm text-white placeholder:text-white/20 focus:outline-none transition-all";
const inputStyle = { background: FT.cardLight, border: `1px solid ${FT.goldBorder}` } as const;

// ─── Log Entry Form ───────────────────────────────────────────────────────────

type EntryType = "expense" | "income";

function LogEntryForm({ year, month }: { year: number; month: number }) {
  const [type, setType] = useState<EntryType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0].name);
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  const addExpense = useAddExpense();
  const addIncome = useAddIncome();

  useEffect(() => {
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    const day = isCurrentMonth ? now.getDate() : new Date(year, month, 0).getDate();
    setDate(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }, [year, month]);

  function handleTypeChange(t: EntryType) {
    setType(t);
    setCategory(t === "expense" ? DEFAULT_EXPENSE_CATEGORIES[0].name : INCOME_CATS[0].name);
  }

  async function handleSave() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error("הזן סכום תקין"); return; }
    setSaving(true);
    try {
      if (type === "expense") {
        await addExpense.mutateAsync({
          amount: num, category, description: description.trim() || undefined,
          date, expense_type: "variable", is_recurring: false, needs_review: false,
        });
      } else {
        await addIncome.mutateAsync({
          amount: num, category, description: description.trim() || undefined, source: "manual", date,
        });
      }
      toast.success(`₪${fmt(num)} נשמר בהצלחה ✓`);
      setAmount(""); setDescription("");
    } catch (e: any) {
      toast.error("שגיאה: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const cats = type === "expense" ? DEFAULT_EXPENSE_CATEGORIES : INCOME_CATS;

  return (
    <div className="rounded-3xl p-5 space-y-4" dir="rtl"
      style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}>
      <p className="text-xs font-black" style={{ color: FT.textMuted, letterSpacing: 0 }}>
        📝 תנועה חדשה
      </p>

      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2">
        {(["expense", "income"] as EntryType[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all"
            style={{
              letterSpacing: 0,
              background: type === t
                ? t === "expense" ? FT.dangerDim : FT.successDim
                : FT.brownDim,
              border: `1px solid ${type === t
                ? t === "expense" ? "rgba(217,107,107,0.35)" : "rgba(124,191,142,0.35)"
                : FT.brownBorder}`,
              color: type === t
                ? t === "expense" ? FT.danger : FT.success
                : FT.textMuted,
            }}
          >
            {t === "expense" ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {t === "expense" ? "הוצאה" : "הכנסה"}
          </button>
        ))}
      </div>

      {/* Amount + Date */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-black" style={{ color: FT.textFaint }}>₪</span>
          <input
            type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0" inputMode="decimal"
            className="w-full pe-8 ps-3 py-3 rounded-[16px] text-xl font-black text-white placeholder:text-white/15 focus:outline-none transition-all"
            style={inputStyle} dir="ltr"
          />
        </div>
        <input
          type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="w-32 rounded-[16px] text-xs px-3 focus:outline-none transition-all"
          style={{ ...inputStyle, color: FT.textMuted }} dir="ltr"
        />
      </div>

      {/* Description */}
      <input
        type="text" value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="תיאור (אופציונלי)"
        className={inputCls} style={inputStyle}
      />

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        {cats.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setCategory(cat.name)}
            className="px-3 py-1 rounded-full text-[11px] font-bold transition-all"
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

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!amount || saving}
        className="w-full py-3 rounded-2xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        style={{
          letterSpacing: 0,
          background: type === "expense" ? FT.danger : FT.gold,
          color: type === "expense" ? "#fff" : FT.bg,
          boxShadow: type === "expense" ? `0 4px 16px ${FT.dangerDim}` : `0 4px 16px ${FT.goldGlow}`,
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <Check className="h-4 w-4" />
          {saving ? "שומר..." : type === "expense" ? "שמור הוצאה" : "שמור הכנסה"}
        </span>
      </button>
    </div>
  );
}

// ─── Add Fixed / Installment Form ─────────────────────────────────────────────

type FixedType = "recurring" | "installment";

function AddFixedForm({ onDone }: { onDone: () => void }) {
  const now = new Date();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [chargeDay, setChargeDay] = useState(1);
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0].name);
  const [fixedType, setFixedType] = useState<FixedType>("recurring");
  const [installTotal, setInstallTotal] = useState(12);
  const [startYm, setStartYm] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [saving, setSaving] = useState(false);

  const addFixed = useAddFixedExpense();

  async function handleSave() {
    if (!name.trim() || !amount) { toast.error("מלא שם וסכום"); return; }
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error("סכום לא תקין"); return; }
    setSaving(true);
    try {
      const notes = fixedType === "installment" ? JSON.stringify({ t: installTotal, s: startYm }) : null;
      await addFixed.mutateAsync({
        name: name.trim(), amount: num, category,
        charge_day: chargeDay, is_active: true,
        is_recurring: fixedType === "recurring", notes,
      });
      toast.success(`"${name.trim()}" נוסף`);
      onDone();
    } catch (e: any) {
      toast.error("שגיאה: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const subInputStyle = { background: FT.card, border: `1px solid ${FT.goldBorder}` } as const;

  return (
    <div className="rounded-2xl p-4 space-y-3" dir="rtl"
      style={{ background: FT.cardLight, border: `1px solid ${FT.goldBorder}` }}>
      <p className="text-[11px] font-black" style={{ color: FT.textSub, letterSpacing: 0 }}>
        הוספת קבועה / תשלומים
      </p>

      {/* Name + Amount */}
      <div className="flex gap-2">
        <input
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="שם (ביטוח רכב, שכירות...)"
          className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
          style={subInputStyle}
        />
        <div className="relative w-28">
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: FT.textFaint }}>₪</span>
          <input
            type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0" inputMode="decimal"
            className="w-full pe-7 ps-3 py-2.5 rounded-xl text-sm font-black text-white placeholder:text-white/15 focus:outline-none transition-all"
            style={subInputStyle} dir="ltr"
          />
        </div>
      </div>

      {/* Category + Charge Day */}
      <div className="flex gap-2">
        <select
          value={category} onChange={(e) => setCategory(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl text-sm text-white focus:outline-none transition-all"
          style={{ ...subInputStyle, color: "#fff" }}
        >
          {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
            <option key={c.name} value={c.name} style={{ background: FT.bg, color: "#fff" }}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={subInputStyle}>
          <span className="text-[11px] shrink-0" style={{ color: FT.textMuted }}>יום</span>
          <input
            type="number" value={chargeDay}
            onChange={(e) => setChargeDay(Math.min(31, Math.max(1, +e.target.value)))}
            min={1} max={31}
            className="w-8 bg-transparent text-sm font-black text-white focus:outline-none text-center"
            dir="ltr"
          />
        </div>
      </div>

      {/* Type toggle */}
      <div className="flex gap-2">
        {(["recurring", "installment"] as FixedType[]).map((ft) => (
          <button
            key={ft}
            onClick={() => setFixedType(ft)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all"
            style={{
              letterSpacing: 0,
              background: fixedType === ft ? FT.goldMid : FT.brownDim,
              border: `1px solid ${fixedType === ft ? FT.goldBorder : FT.brownBorder}`,
              color: fixedType === ft ? FT.gold : FT.textMuted,
            }}
          >
            {ft === "recurring"
              ? <><RefreshCw className="h-3 w-3" /> חיוב חוזר</>
              : <><CreditCard className="h-3 w-3" /> תשלומים</>}
          </button>
        ))}
      </div>

      {/* Installment settings */}
      {fixedType === "installment" && (
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2.5" style={subInputStyle}>
            <span className="text-[11px] shrink-0" style={{ color: FT.textMuted }}>סה״כ</span>
            <input
              type="number" value={installTotal}
              onChange={(e) => setInstallTotal(Math.max(2, +e.target.value))}
              min={2}
              className="flex-1 bg-transparent text-sm font-black text-white focus:outline-none text-center"
              dir="ltr"
            />
            <span className="text-[11px] shrink-0" style={{ color: FT.textMuted }}>תשלומים</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={subInputStyle}>
            <span className="text-[10px] shrink-0" style={{ color: FT.textMuted }}>מ:</span>
            <input
              type="month" value={startYm} onChange={(e) => setStartYm(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none w-24" dir="ltr"
            />
          </div>
        </div>
      )}

      {/* Installment preview */}
      {fixedType === "installment" && amount && installTotal >= 2 && (
        <div className="rounded-xl px-3 py-2" style={{ background: FT.goldDim, border: `1px solid ${FT.goldBorder}` }}>
          <p className="text-[11px]" style={{ color: FT.gold, letterSpacing: 0 }}>
            💡 ₪{fmt(parseFloat(amount) || 0)} / חודש למשך {installTotal} חודשים
            {" · "}סה״כ ₪{fmt((parseFloat(amount) || 0) * installTotal)}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onDone}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors"
          style={{ background: FT.brownDim, border: `1px solid ${FT.brownBorder}`, color: FT.textMuted, letterSpacing: 0 }}
        >
          ביטול
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !amount}
          className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-40 active:scale-[0.98]"
          style={{
            letterSpacing: 0,
            background: FT.gold,
            color: FT.bg,
            boxShadow: `0 4px 16px ${FT.goldGlow}`,
          }}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            {saving ? "שומר..." : "הוסף"}
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Fixed Expense Card ───────────────────────────────────────────────────────

interface FixedItem {
  id: string; name: string; amount: number; category: string;
  charge_day: number; is_active: boolean; is_recurring: boolean; notes: string | null;
}

function FixedExpenseCard({ item, year, month }: { item: FixedItem; year: number; month: number }) {
  const updateFixed = useUpdateFixedExpense();
  const deleteFixed = useDeleteFixedExpense();
  const [deleting, setDeleting] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meta = parseInstallMeta(item.notes);
  const progress = meta ? installProgress(meta, year, month) : null;

  useEffect(() => {
    if (progress && !progress.active && item.is_active) {
      updateFixed.mutate({ id: item.id, is_active: false });
    }
  }, [progress?.active, item.is_active, item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current); };
  }, []);

  async function toggleActive() {
    await updateFixed.mutateAsync({ id: item.id, is_active: !item.is_active });
    toast.success(item.is_active ? "הפסקת חיוב" : "הופעל מחדש");
  }

  function handleDelete() {
    if (!deleting) {
      setDeleting(true);
      deleteTimerRef.current = setTimeout(() => setDeleting(false), 3000);
      return;
    }
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    deleteFixed.mutate(item.id);
    toast.success(`"${item.name}" נמחק`);
  }

  const catObj = DEFAULT_EXPENSE_CATEGORIES.find((c) => c.name === item.category);
  const pctFilled = progress ? (progress.current / progress.total) * 100 : 0;
  const barColor =
    !progress ? FT.brown :
    progress.remaining === 0 ? FT.success :
    progress.remaining <= 2 ? FT.brown : FT.gold;

  return (
    <div
      className="rounded-2xl p-4 space-y-3 transition-all"
      style={{
        background: item.is_active ? FT.cardLight : FT.card,
        border: `1px solid ${item.is_active ? FT.goldBorder : FT.brownBorder}`,
        opacity: item.is_active ? 1 : 0.5,
      }}
      dir="rtl"
    >
      {/* Header row: icon | name+sub | amount | toggle */}
      <div className="flex items-center gap-2.5">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-lg leading-none"
          style={{ background: FT.goldDim, border: `1px solid ${FT.goldBorder}` }}
        >
          {catObj?.icon ?? "💳"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white truncate" style={{ letterSpacing: 0 }}>{item.name}</p>
          <p className="text-[10px] mt-0.5" style={{ color: FT.textMuted }}>
            יום {item.charge_day} · {item.category}
          </p>
        </div>
        <p className="text-sm font-black shrink-0" style={{ color: FT.danger }} dir="ltr">
          ₪{fmt(item.amount)}
        </p>
        {/* Gold toggle switch */}
        <button
          onClick={toggleActive}
          aria-label={item.is_active ? "כבה" : "הדלק"}
          className="h-6 w-11 rounded-full relative transition-all shrink-0"
          style={{ background: item.is_active ? FT.gold : FT.brownDim, border: `1px solid ${item.is_active ? FT.goldBorder : FT.brownBorder}` }}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full shadow-md transition-all"
            style={{
              background: item.is_active ? FT.bg : "rgba(255,255,255,0.4)",
              [item.is_active ? "insetInlineEnd" : "insetInlineStart"]: "2px",
              position: "absolute",
              ...(item.is_active ? { right: "2px" } : { left: "2px" }),
            }}
          />
        </button>
      </div>

      {/* Installment progress */}
      {progress && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/70" style={{ letterSpacing: 0 }}>
              💳 תשלום {progress.current} מתוך {progress.total}
            </span>
            <span className="text-[10px]" style={{ color: FT.textFaint }}>
              {progress.remaining > 0 ? `${progress.remaining} נותרו` : "✅ אחרון!"}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pctFilled}%`, background: barColor }}
            />
          </div>
          {meta && (
            <p className="text-[9px]" style={{ color: FT.textFaint, letterSpacing: 0 }}>
              החל מ-{meta.s} · {progress.total} תשלומים
            </p>
          )}
        </div>
      )}

      {/* Recurring badge */}
      {item.is_recurring && !meta && (
        <div className="flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3" style={{ color: FT.textFaint }} />
          <span className="text-[10px]" style={{ color: FT.textFaint, letterSpacing: 0 }}>חיוב חוזר כל חודש</span>
        </div>
      )}

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="w-full py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
        style={{
          letterSpacing: 0,
          background: deleting ? FT.dangerDim : "transparent",
          border: `1px solid ${deleting ? "rgba(217,107,107,0.3)" : "transparent"}`,
          color: deleting ? FT.danger : FT.textFaint,
        }}
      >
        <Trash2 className="h-3 w-3" />
        {deleting ? "לחץ שוב לאישור מחיקה" : "מחק"}
      </button>
    </div>
  );
}

// ─── Fixed Expenses Section ───────────────────────────────────────────────────

function FixedSection({ year, month }: { year: number; month: number }) {
  const { data: fixed, isLoading } = useFixedExpenses();
  const [showForm, setShowForm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const items = (fixed || []) as FixedItem[];
  const active = items.filter((f) => f.is_active);
  const inactive = items.filter((f) => !f.is_active);
  const totalMonthly = active.reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div className="rounded-3xl p-5 space-y-4" dir="rtl"
      style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black" style={{ color: FT.textMuted, letterSpacing: 0 }}>🔁 קבועות ותשלומים</p>
          {active.length > 0 && (
            <p className="text-[10px] mt-0.5" style={{ color: FT.textFaint }}>
              {active.length} פעילות · ₪{fmt(totalMonthly)} / חודש
            </p>
          )}
        </div>
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
          <Plus className="h-3.5 w-3.5" />
          הוסף
        </button>
      </div>

      {showForm && <AddFixedForm onDone={() => setShowForm(false)} />}

      {/* Active items */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${FT.goldBorder} ${FT.goldBorder} ${FT.goldBorder} ${FT.gold}` }} />
        </div>
      ) : active.length === 0 && !showForm ? (
        <p className="text-center text-xs py-6" style={{ color: FT.textFaint, letterSpacing: 0 }}>
          אין קבועות פעילות · לחץ "הוסף" להוספה ראשונה
        </p>
      ) : (
        <div className="space-y-2">
          {active.map((f) => <FixedExpenseCard key={f.id} item={f} year={year} month={month} />)}
        </div>
      )}

      {/* Show/hide inactive */}
      {inactive.length > 0 && (
        <>
          <button
            onClick={() => setShowInactive((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs transition-colors"
            style={{ color: FT.textFaint, letterSpacing: 0 }}
          >
            {showInactive ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showInactive ? "הסתר לא פעילות" : `הצג ${inactive.length} לא פעילות`}
          </button>
          {showInactive && (
            <div className="space-y-2">
              {inactive.map((f) => <FixedExpenseCard key={f.id} item={f} year={year} month={month} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function FinanceOperationsTab({ year, month }: { year: number; month: number }) {
  return (
    <div className="space-y-4">
      <LogEntryForm year={year} month={month} />
      <FixedSection year={year} month={month} />
    </div>
  );
}
