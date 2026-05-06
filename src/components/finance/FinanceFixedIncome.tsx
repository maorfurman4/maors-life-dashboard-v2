import { useState } from "react";
import { TrendingUp, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from "lucide-react";
import {
  useFixedIncome,
  useAddFixedIncome,
  useUpdateFixedIncome,
  useDeleteFixedIncome,
  INCOME_CATEGORIES_FIXED,
} from "@/hooks/use-finance-data";
import { FT } from "@/lib/finance-theme";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });
const inputStyle = { background: FT.cardLight, border: `1px solid ${FT.goldBorder}` } as const;
const inputCls = "w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-all";

export function FinanceFixedIncome() {
  const { data: fixedIncome } = useFixedIncome();
  const addFixed = useAddFixedIncome();
  const updateFixed = useUpdateFixedIncome();
  const deleteFixed = useDeleteFixedIncome();

  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("משכורת");
  const [customCategory, setCustomCategory] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  const handleSave = () => {
    if (!name.trim() || !amount || Number(amount) <= 0) {
      toast.error("הזן שם וסכום");
      return;
    }
    const finalCategory = category === "אחר" && customCategory.trim() ? customCategory.trim() : category;
    addFixed.mutate(
      { name: name.trim(), amount: Number(amount), category: finalCategory, day_of_month: Number(dayOfMonth) || 1 },
      {
        onSuccess: () => {
          toast.success("הכנסה קבועה נשמרה");
          setShowForm(false);
          setName(""); setAmount(""); setCategory("משכורת"); setCustomCategory(""); setDayOfMonth("1");
        },
        onError: (e) => toast.error("שגיאה: " + (e as Error).message),
      }
    );
  };

  const toggleActive = (id: string, current: boolean) => {
    updateFixed.mutate({ id, is_active: !current });
  };

  const totalActive = (fixedIncome || [])
    .filter((f: any) => f.is_active)
    .reduce((s: number, f: any) => s + Number(f.amount), 0);

  return (
    <div
      className="rounded-3xl p-4 space-y-3"
      style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{ color: FT.success }} />
          <p className="text-xs font-black" style={{ color: FT.textSub, letterSpacing: 0 }}>
            הכנסות קבועות
          </p>
          {totalActive > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: FT.successDim, color: FT.success }}>
              +₪{fmt(totalActive)}/חודש
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
          style={{ background: FT.successDim, border: `1px solid rgba(124,191,142,0.3)`, color: FT.success, letterSpacing: 0 }}
        >
          <Plus className="h-3.5 w-3.5" />
          הוסף
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="שם ההכנסה (משכורת, שכ״ד, פרילנס...)"
            className={inputCls} style={inputStyle}
          />

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5">
            {INCOME_CATEGORIES_FIXED.map((c) => (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors"
                style={{
                  borderColor: category === c.name ? "rgba(124,191,142,0.4)" : FT.brownBorder,
                  background: category === c.name ? FT.successDim : FT.brownDim,
                  color: category === c.name ? FT.success : FT.textMuted,
                }}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {/* Custom category when "אחר" */}
          {category === "אחר" && (
            <input
              value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="פרט את סוג ההכנסה..."
              className={inputCls} style={inputStyle}
              autoFocus
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] mb-1" style={{ color: FT.textFaint }}>סכום חודשי (₪)</p>
              <input
                type="number" inputMode="numeric"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className={inputCls} style={inputStyle} dir="ltr"
              />
            </div>
            <div>
              <p className="text-[10px] mb-1" style={{ color: FT.textFaint }}>יום בחודש</p>
              <input
                type="number" inputMode="numeric" min="1" max="31"
                value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)}
                placeholder="1"
                className={inputCls} style={inputStyle} dir="ltr"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-colors"
              style={{ background: FT.brownDim, border: `1px solid ${FT.brownBorder}`, color: FT.textMuted, letterSpacing: 0 }}
            >
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={addFixed.isPending}
              className="flex-1 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: FT.success, color: FT.bg, letterSpacing: 0 }}
            >
              שמור
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {(!fixedIncome || fixedIncome.length === 0) && !showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full text-center py-4 rounded-2xl border-2 border-dashed text-xs transition-all"
          style={{ borderColor: "rgba(124,191,142,0.2)", color: FT.textFaint, letterSpacing: 0 }}
        >
          הוסף משכורת, שכ״ד, פרילנס קבוע ועוד
        </button>
      ) : (
        <>
          <div className="space-y-2">
            {(showAll ? (fixedIncome || []) : (fixedIncome || []).slice(0, 2)).map((f: any) => (
              <div
                key={f.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all"
                style={{
                  background: f.is_active ? FT.cardLight : FT.brownDim,
                  border: `1px solid ${f.is_active ? "rgba(124,191,142,0.15)" : FT.brownBorder}`,
                  opacity: f.is_active ? 1 : 0.55,
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate" style={{ letterSpacing: 0 }}>{f.name}</p>
                  <p className="text-[10px]" style={{ color: FT.textFaint }}>
                    {f.category} · יום {f.day_of_month} לחודש
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black" style={{ color: FT.success }} dir="ltr">
                    +₪{fmt(Number(f.amount))}
                  </span>
                  <button
                    onClick={() => toggleActive(f.id, f.is_active)}
                    style={{ color: f.is_active ? FT.success : FT.textFaint }}
                  >
                    {f.is_active
                      ? <ToggleRight className="h-4 w-4" />
                      : <ToggleLeft  className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => deleteFixed.mutate(f.id, { onSuccess: () => toast.success("נמחק") })}
                    className="h-6 w-6 flex items-center justify-center rounded-lg transition-all active:scale-90"
                    style={{ background: FT.dangerDim, color: FT.danger }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {(fixedIncome || []).length > 2 && (
            <button onClick={() => setShowAll((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold transition-all"
              style={{ color: FT.textMuted, letterSpacing: 0 }}>
              {showAll
                ? <><ChevronUp className="h-3.5 w-3.5" /> הסתר</>
                : <><ChevronDown className="h-3.5 w-3.5" /> הצג הכל ({(fixedIncome || []).length})</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}
