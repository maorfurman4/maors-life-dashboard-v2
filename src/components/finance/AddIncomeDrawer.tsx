import { useState } from "react";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { useAddIncome, INCOME_CATEGORIES } from "@/hooks/use-finance-data";
import { toast } from "sonner";

interface AddIncomeDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AddIncomeDrawer({ open, onClose }: AddIncomeDrawerProps) {
  const [category, setCategory] = useState("other");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const addIncome = useAddIncome();

  const handleSave = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("הזן סכום תקין");
      return;
    }
    addIncome.mutate(
      {
        amount: Number(amount),
        category,
        description: description || undefined,
        date,
        source: "manual",
      },
      {
        onSuccess: () => {
          toast.success("הכנסה נשמרה");
          onClose();
          setAmount("");
          setDescription("");
          setCategory("other");
        },
        onError: () => toast.error("שגיאה בשמירה"),
      }
    );
  };

  return (
    <AddItemDrawer open={open} onClose={onClose} title="הוסף הכנסה">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">סוג</label>
          <div className="grid grid-cols-2 gap-2">
            {INCOME_CATEGORIES.filter(c => c.value !== "salary").map((cat) => (
              <button key={cat.value} onClick={() => setCategory(cat.value)}
                className={`px-3 py-2.5 rounded-xl border transition-colors text-xs font-medium ${
                  category === cat.value ? "border-finance bg-finance/10 text-finance" : "border-border bg-card hover:bg-secondary/40 text-foreground"
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">הכנסה מהעבודה מחושבת אוטומטית מהמשמרות</p>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">סכום (₪)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance" dir="ltr" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">תיאור</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="מקור ההכנסה..."
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">תאריך</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance" />
        </div>

        <button onClick={handleSave} disabled={addIncome.isPending}
          className="w-full py-3 rounded-xl bg-finance text-finance-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {addIncome.isPending ? "שומר..." : "שמור הכנסה"}
        </button>
      </div>
    </AddItemDrawer>
  );
}
