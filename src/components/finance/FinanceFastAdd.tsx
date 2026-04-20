import { useState } from "react";
import { Plus, Minus, Check } from "lucide-react";
import { useAddExpense, useAddIncome, DEFAULT_EXPENSE_CATEGORIES } from "@/hooks/use-finance-data";
import { toast } from "sonner";

type EntryType = "expense" | "income";

const INCOME_SOURCES = ["משכורת", "פרילנס", "שיעורים", "אחר"];

export function FinanceFastAdd() {
  const [type, setType] = useState<EntryType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0].name);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const addExpense = useAddExpense();
  const addIncome = useAddIncome();

  const today = new Date().toISOString().slice(0, 10);

  const handleSave = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error("הזן סכום תקין"); return; }
    setSaving(true);
    try {
      if (type === "expense") {
        await addExpense.mutateAsync({
          amount: num,
          category,
          description: description || undefined,
          date: today,
          expense_type: "variable",
          is_recurring: false,
          needs_review: false,
        });
        toast.success(`₪${num.toLocaleString("he-IL")} נשמר בהוצאות`);
      } else {
        await addIncome.mutateAsync({
          amount: num,
          source: category,
          category,
          description: description || undefined,
          date: today,
        });
        toast.success(`₪${num.toLocaleString("he-IL")} נשמר בהכנסות`);
      }
      setAmount("");
      setDescription("");
    } catch (e: any) {
      toast.error("שגיאה: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const cats = type === "expense" ? DEFAULT_EXPENSE_CATEGORIES.map(c => c.name) : INCOME_SOURCES;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3" dir="rtl">
      <h3 className="text-sm font-bold text-muted-foreground" style={{ letterSpacing: 0 }}>
        הוספה מהירה
      </h3>

      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { setType("expense"); setCategory(DEFAULT_EXPENSE_CATEGORIES[0].name); }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
            type === "expense"
              ? "border-rose-400/50 bg-rose-400/10 text-rose-400"
              : "border-border bg-secondary/30 text-muted-foreground"
          }`}
        >
          <Minus className="h-3.5 w-3.5" />
          הוצאה
        </button>
        <button
          onClick={() => { setType("income"); setCategory(INCOME_SOURCES[0]); }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
            type === "income"
              ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
              : "border-border bg-secondary/30 text-muted-foreground"
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          הכנסה
        </button>
      </div>

      {/* Amount */}
      <div className="relative">
        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₪</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="0"
          className={`w-full pe-8 ps-3 py-3 rounded-xl border bg-secondary/30 text-xl font-black focus:outline-none transition-colors ${
            type === "expense" ? "focus:border-rose-400/50" : "focus:border-emerald-400/50"
          } border-border`}
          dir="ltr"
          autoFocus
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        {cats.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              category === cat
                ? type === "expense"
                  ? "border-rose-400/50 bg-rose-400/10 text-rose-400"
                  : "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                : "border-border bg-secondary/30 text-muted-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Description (optional) */}
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        placeholder="תיאור (אופציונלי)"
        className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance"
      />

      <button
        onClick={handleSave}
        disabled={saving || !amount}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 min-h-[44px] ${
          type === "expense"
            ? "bg-rose-400/15 text-rose-400 hover:bg-rose-400/25 border border-rose-400/30"
            : "bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25 border border-emerald-400/30"
        }`}
      >
        <Check className="h-4 w-4" />
        {saving ? "שומר..." : `שמור ${type === "expense" ? "הוצאה" : "הכנסה"}`}
      </button>
    </div>
  );
}
