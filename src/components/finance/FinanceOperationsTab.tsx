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
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

// ─── Installment helpers ──────────────────────────────────────────────────────

interface InstallMeta {
  t: number; // total payments
  s: string; // start "YYYY-MM"
}

function parseInstallMeta(notes: string | null): InstallMeta | null {
  if (!notes || !notes.startsWith("{")) return null;
  try {
    const m = JSON.parse(notes);
    if (typeof m.t === "number" && typeof m.s === "string") return m;
    return null;
  } catch {
    return null;
  }
}

function installProgress(meta: InstallMeta, year: number, month: number) {
  const [sy, sm] = meta.s.split("-").map(Number);
  const elapsed = (year - sy) * 12 + (month - sm);
  const current = elapsed + 1; // 1-indexed: month 0 = payment 1
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
          amount: num,
          category,
          description: description.trim() || undefined,
          date,
          expense_type: "variable",
          is_recurring: false,
          needs_review: false,
        });
      } else {
        await addIncome.mutateAsync({
          amount: num,
          category,
          description: description.trim() || undefined,
          source: "manual",
          date,
        });
      }
      toast.success(`₪${fmt(num)} נשמר בהצלחה ✓`);
      setAmount("");
      setDescription("");
    } catch (e: any) {
      toast.error("שגיאה: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const cats = type === "expense" ? DEFAULT_EXPENSE_CATEGORIES : INCOME_CATS;

  return (
    <div
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 space-y-4"
      dir="rtl"
    >
      <p className="text-xs font-black text-white/50" style={{ letterSpacing: 0 }}>
        📝 תנועה חדשה
      </p>

      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2">
        {(["expense", "income"] as EntryType[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              type === t
                ? t === "expense"
                  ? "bg-rose-500/20 border border-rose-400/40 text-rose-400"
                  : "bg-emerald-500/20 border border-emerald-400/40 text-emerald-400"
                : "bg-white/5 border border-white/10 text-white/40"
            }`}
            style={{ letterSpacing: 0 }}
          >
            {t === "expense" ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {t === "expense" ? "הוצאה" : "הכנסה"}
          </button>
        ))}
      </div>

      {/* Amount + Date */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-white/30 font-black text-sm">
            ₪
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            inputMode="decimal"
            className="w-full pe-8 ps-3 py-3 rounded-2xl bg-white/8 border border-white/10 text-xl font-black text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-all"
            dir="ltr"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-32 rounded-2xl bg-white/8 border border-white/10 text-xs text-white/60 px-3 focus:outline-none focus:border-sky-500/40 transition-all"
          dir="ltr"
        />
      </div>

      {/* Description */}
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="תיאור (אופציונלי)"
        className="w-full px-4 py-2.5 rounded-2xl bg-white/8 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sky-500/40 transition-all"
      />

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        {cats.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setCategory(cat.name)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
              category === cat.name
                ? type === "expense"
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

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!amount || saving}
        className={`w-full py-3 rounded-2xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          type === "expense"
            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-400 active:scale-[0.98]"
            : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 active:scale-[0.98]"
        }`}
        style={{ letterSpacing: 0 }}
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
      const notes =
        fixedType === "installment"
          ? JSON.stringify({ t: installTotal, s: startYm })
          : null;
      await addFixed.mutateAsync({
        name: name.trim(),
        amount: num,
        category,
        charge_day: chargeDay,
        is_active: true,
        is_recurring: fixedType === "recurring",
        notes,
      });
      toast.success(`"${name.trim()}" נוסף`);
      onDone();
    } catch (e: any) {
      toast.error("שגיאה: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white/8 border border-emerald-400/20 p-4 space-y-3" dir="rtl">
      <p className="text-[11px] font-black text-emerald-400/70" style={{ letterSpacing: 0 }}>
        הוספת קבועה / תשלומים
      </p>

      {/* Name + Amount */}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם (ביטוח רכב, שכירות...)"
          className="flex-1 px-3 py-2.5 rounded-xl bg-white/8 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sky-500/40 transition-all"
        />
        <div className="relative w-28">
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">₪</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            inputMode="decimal"
            className="w-full pe-7 ps-3 py-2.5 rounded-xl bg-white/8 border border-white/10 text-sm font-black text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-all"
            dir="ltr"
          />
        </div>
      </div>

      {/* Category + Charge Day */}
      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl bg-white/8 border border-white/10 text-sm text-white focus:outline-none transition-all"
        >
          {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
            <option key={c.name} value={c.name} className="bg-[#0e1320] text-white">
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 rounded-xl bg-white/8 border border-white/10 px-3 py-2">
          <span className="text-[11px] text-white/40 shrink-0">יום חיוב</span>
          <input
            type="number"
            value={chargeDay}
            onChange={(e) => setChargeDay(Math.min(31, Math.max(1, +e.target.value)))}
            min={1}
            max={31}
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold border transition-all ${
              fixedType === ft
                ? "border-sky-400/50 bg-sky-400/15 text-sky-300"
                : "border-white/10 bg-white/5 text-white/40"
            }`}
            style={{ letterSpacing: 0 }}
          >
            {ft === "recurring" ? (
              <><RefreshCw className="h-3 w-3" /> חיוב חוזר</>
            ) : (
              <><CreditCard className="h-3 w-3" /> תשלומים</>
            )}
          </button>
        ))}
      </div>

      {/* Installment settings (conditional) */}
      {fixedType === "installment" && (
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 rounded-xl bg-white/8 border border-white/10 px-3 py-2.5">
            <span className="text-[11px] text-white/40 shrink-0">סה״כ</span>
            <input
              type="number"
              value={installTotal}
              onChange={(e) => setInstallTotal(Math.max(2, +e.target.value))}
              min={2}
              className="flex-1 bg-transparent text-sm font-black text-white focus:outline-none text-center"
              dir="ltr"
            />
            <span className="text-[11px] text-white/40 shrink-0">תשלומים</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/8 border border-white/10 px-3 py-2.5">
            <span className="text-[10px] text-white/40 shrink-0">מ:</span>
            <input
              type="month"
              value={startYm}
              onChange={(e) => setStartYm(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none w-24"
              dir="ltr"
            />
          </div>
        </div>
      )}

      {/* Installment preview */}
      {fixedType === "installment" && amount && installTotal >= 2 && (
        <div className="rounded-xl bg-sky-500/10 border border-sky-400/20 px-3 py-2">
          <p className="text-[11px] text-sky-300" style={{ letterSpacing: 0 }}>
            💡 ₪{fmt(parseFloat(amount) || 0)} / חודש למשך {installTotal} חודשים
            {" · "}סה״כ ₪{fmt((parseFloat(amount) || 0) * installTotal)}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onDone}
          className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/50 hover:text-white transition-colors"
          style={{ letterSpacing: 0 }}
        >
          ביטול
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !amount}
          className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white text-xs font-black shadow-lg shadow-sky-500/30 hover:bg-sky-400 active:scale-[0.98] transition-all disabled:opacity-40"
          style={{ letterSpacing: 0 }}
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
  id: string;
  name: string;
  amount: number;
  category: string;
  charge_day: number;
  is_active: boolean;
  is_recurring: boolean;
  notes: string | null;
}

function FixedExpenseCard({
  item,
  year,
  month,
}: {
  item: FixedItem;
  year: number;
  month: number;
}) {
  const updateFixed = useUpdateFixedExpense();
  const deleteFixed = useDeleteFixedExpense();
  const [deleting, setDeleting] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meta = parseInstallMeta(item.notes);
  const progress = meta ? installProgress(meta, year, month) : null;

  // Auto-deactivate when all installments complete
  useEffect(() => {
    if (progress && !progress.active && item.is_active) {
      updateFixed.mutate({ id: item.id, is_active: false });
    }
  }, [progress?.active, item.is_active, item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
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
    !progress ? "bg-white/20" :
    progress.remaining === 0 ? "bg-emerald-400" :
    progress.remaining <= 2 ? "bg-amber-400" : "bg-sky-400";

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 transition-all ${
        item.is_active
          ? "bg-white/5 border-white/10"
          : "bg-white/[0.02] border-white/5 opacity-50"
      }`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-xl leading-none shrink-0">{catObj?.icon ?? "💳"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white truncate" style={{ letterSpacing: 0 }}>
            {item.name}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">
            יום {item.charge_day} · {item.category}
          </p>
        </div>
        <p className="text-sm font-black text-rose-400 shrink-0" dir="ltr">
          ₪{fmt(item.amount)}
        </p>
        {/* Toggle switch */}
        <button
          onClick={toggleActive}
          aria-label={item.is_active ? "כבה" : "הדלק"}
          className={`h-6 w-11 rounded-full relative transition-all shrink-0 ${
            item.is_active ? "bg-emerald-500" : "bg-white/15"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all ${
              item.is_active ? "end-0.5" : "start-0.5"
            }`}
          />
        </button>
      </div>

      {/* Installment progress bar */}
      {progress && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/70" style={{ letterSpacing: 0 }}>
              💳 תשלום {progress.current} מתוך {progress.total}
            </span>
            <span className="text-[10px] text-white/30">
              {progress.remaining > 0
                ? `${progress.remaining} חודשים נותרו`
                : "✅ תשלום אחרון!"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${pctFilled}%` }}
            />
          </div>
          {/* Month range */}
          {meta && (
            <p className="text-[9px] text-white/20" style={{ letterSpacing: 0 }}>
              החל מ-{meta.s} · {progress.total} תשלומים
            </p>
          )}
        </div>
      )}

      {/* Recurring badge */}
      {item.is_recurring && !meta && (
        <div className="flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3 text-white/25" />
          <span className="text-[10px] text-white/25" style={{ letterSpacing: 0 }}>
            חיוב חוזר כל חודש
          </span>
        </div>
      )}

      {/* Delete with confirm */}
      <button
        onClick={handleDelete}
        className={`w-full py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
          deleting
            ? "bg-rose-500/20 border border-rose-400/40 text-rose-400"
            : "bg-white/5 border border-white/5 text-white/20 hover:text-white/50"
        }`}
        style={{ letterSpacing: 0 }}
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
    <div
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 space-y-4"
      dir="rtl"
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-white/50" style={{ letterSpacing: 0 }}>
            🔁 קבועות ותשלומים
          </p>
          {active.length > 0 && (
            <p className="text-[10px] text-white/25 mt-0.5">
              {active.length} פעילות · ₪{fmt(totalMonthly)} / חודש
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-400 text-xs font-black hover:bg-sky-500/25 active:scale-95 transition-all"
          style={{ letterSpacing: 0 }}
        >
          <Plus className="h-3.5 w-3.5" />
          הוסף
        </button>
      </div>

      {/* Add form (collapsible) */}
      {showForm && <AddFixedForm onDone={() => setShowForm(false)} />}

      {/* Active items */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 rounded-full border-2 border-white/15 border-t-sky-400 animate-spin" />
        </div>
      ) : active.length === 0 && !showForm ? (
        <p
          className="text-center text-white/25 text-xs py-6"
          style={{ letterSpacing: 0 }}
        >
          אין קבועות פעילות · לחץ "הוסף" להוספה ראשונה
        </p>
      ) : (
        <div className="space-y-2">
          {active.map((f) => (
            <FixedExpenseCard key={f.id} item={f} year={year} month={month} />
          ))}
        </div>
      )}

      {/* Show/hide inactive */}
      {inactive.length > 0 && (
        <>
          <button
            onClick={() => setShowInactive((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-white/25 hover:text-white/50 transition-colors"
            style={{ letterSpacing: 0 }}
          >
            {showInactive ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {showInactive ? "הסתר לא פעילות" : `הצג ${inactive.length} לא פעילות`}
          </button>
          {showInactive && (
            <div className="space-y-2">
              {inactive.map((f) => (
                <FixedExpenseCard key={f.id} item={f} year={year} month={month} />
              ))}
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
