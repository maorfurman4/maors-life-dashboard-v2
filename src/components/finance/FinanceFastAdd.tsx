import { useState } from "react";
import { Plus, Minus, Check, Bookmark } from "lucide-react";
import {
  useAddExpense,
  useAddIncome,
  useExpenseCategories,
  useUpsertCategory,
  DEFAULT_EXPENSE_CATEGORIES,
} from "@/hooks/use-finance-data";
import { toast } from "sonner";
import { AmountScrollPicker } from "./AmountScrollPicker";

type EntryType = "expense" | "income";

const INCOME_SOURCES = ["משכורת", "פרילנס", "שיעורים", "אחר"];

export function FinanceFastAdd() {
  const [type, setType] = useState<EntryType>("expense");
  const [amount, setAmount] = useState<number | null>(null);
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0].name);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [customCat, setCustomCat] = useState("");

  const addExpense = useAddExpense();
  const addIncome = useAddIncome();
  const upsertCategory = useUpsertCategory();
  const { data: dbCategories } = useExpenseCategories();

  const today = new Date().toISOString().slice(0, 10);

  const handleSave = async () => {
    const num = amount && amount > 0 ? amount : null;
    if (!num) { toast.error("הזן סכום תקין"); return; }
    const finalCategory = category === "אחר" && customCat.trim() ? customCat.trim() : category;
    setSaving(true);
    try {
      if (type === "expense") {
        await addExpense.mutateAsync({
          amount: num,
          category: finalCategory,
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
          source: finalCategory,
          category: finalCategory,
          description: description || undefined,
          date: today,
        });
        toast.success(`₪${num.toLocaleString("he-IL")} נשמר בהכנסות`);
      }
      setAmount(null);
      setDescription("");
      setCustomCat("");
    } catch (e: any) {
      toast.error("שגיאה: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomCategory = () => {
    const name = customCat.trim();
    if (!name) { toast.error("הזן שם קטגוריה"); return; }
    upsertCategory.mutate(
      { name, icon: "📦", sort_order: (dbCategories?.length ?? 0) + DEFAULT_EXPENSE_CATEGORIES.length },
      {
        onSuccess: () => {
          toast.success(`קטגוריה "${name}" נשמרה`);
          setCategory(name);
          setCustomCat("");
        },
        onError: (e) => toast.error("שגיאה: " + e.message),
      }
    );
  };

  // Merge default + DB categories (deduplicated)
  const defaultNames = DEFAULT_EXPENSE_CATEGORIES.map((c) => c.name);
  const dbNames = (dbCategories || []).map((c: any) => c.name).filter((n: string) => !defaultNames.includes(n));
  const expenseCats = [...defaultNames, ...dbNames];

  const cats = type === "expense" ? expenseCats : INCOME_SOURCES;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3" dir="rtl">
      <h3 className="text-sm font-bold text-muted-foreground" style={{ letterSpacing: 0 }}>
        הוספה מהירה
      </h3>

      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { setType("expense"); setCategory(DEFAULT_EXPENSE_CATEGORIES[0].name); setCustomCat(""); }}
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
          onClick={() => { setType("income"); setCategory(INCOME_SOURCES[0]); setCustomCat(""); }}
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

      {/* Amount scroll picker */}
      <AmountScrollPicker value={amount} onChange={setAmount} color={type} />

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        {cats.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); if (cat !== "אחר") setCustomCat(""); }}
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

      {/* Custom category input when "אחר" selected */}
      {category === "אחר" && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            type="text"
            value={customCat}
            onChange={(e) => setCustomCat(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && customCat.trim() && handleSaveCustomCategory()}
            placeholder="הזן קטגוריה מותאמת..."
            className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance"
            autoFocus
          />
          {customCat.trim() && (
            <button
              onClick={handleSaveCustomCategory}
              disabled={upsertCategory.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors border-finance/40 bg-finance/10 text-finance hover:bg-finance/20 disabled:opacity-50"
            >
              <Bookmark className="h-3 w-3" />
              שמור קטגוריה קבועה
            </button>
          )}
        </div>
      )}

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
