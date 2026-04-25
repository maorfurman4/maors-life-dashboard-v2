import { useState } from "react";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { useAddExpense, DEFAULT_EXPENSE_CATEGORIES } from "@/hooks/use-finance-data";
import { toast } from "sonner";

interface AddExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AddExpenseDrawer({ open, onClose }: AddExpenseDrawerProps) {
  const [category, setCategory] = useState("מזון");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isRecurring, setIsRecurring] = useState(false);
  const addExpense = useAddExpense();

  const handleSave = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("הזן סכום תקין");
      return;
    }
    addExpense.mutate(
      {
        amount: Number(amount),
        category,
        description: description || undefined,
        date,
        expense_type: "variable",
        is_recurring: isRecurring,
        needs_review: false,
      },
      {
        onSuccess: () => {
          toast.success("הוצאה נשמרה");
          onClose();
          setAmount("");
          setDescription("");
          setCategory("מזון");
          setIsRecurring(false);
        },
        onError: (err) => {
          console.error("AddExpense error:", err);
          toast.error("שגיאה בשמירת הוצאה: " + ((err as Error).message || "נסה שוב"));
        },
      }
    );
  };

  return (
    <AddItemDrawer open={open} onClose={onClose} title="הוסף הוצאה">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">קטגוריה</label>
          <div className="grid grid-cols-3 gap-2">
            {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
              <button key={cat.name} onClick={() => setCategory(cat.name)}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border transition-colors text-xs font-medium ${
                  category === cat.name ? "border-finance bg-finance/10 text-finance" : "border-border bg-card hover:bg-secondary/40 text-foreground"
                }`}>
                <span className="text-base">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">סכום (₪)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance" dir="ltr" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">תיאור</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="תיאור ההוצאה..."
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">תאריך</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance" />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsRecurring(!isRecurring)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isRecurring ? "border-finance bg-finance/10 text-finance" : "border-border text-muted-foreground"
            }`}>
            {isRecurring ? "✓ הוצאה חוזרת" : "הוצאה חד-פעמית"}
          </button>
        </div>

        <button onClick={handleSave} disabled={addExpense.isPending}
          className="w-full py-3 rounded-xl bg-finance text-finance-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {addExpense.isPending ? "שומר..." : "שמור הוצאה"}
        </button>
      </div>
    </AddItemDrawer>
  );
}
