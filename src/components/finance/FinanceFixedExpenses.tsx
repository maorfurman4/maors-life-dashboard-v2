import { useState } from "react";
import { CalendarDays, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useFixedExpenses, useAddFixedExpense, useDeleteFixedExpense, useUpdateFixedExpense, DEFAULT_EXPENSE_CATEGORIES } from "@/hooks/use-finance-data";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { toast } from "sonner";

const fmtNum = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

export function FinanceFixedExpenses() {
  const { data: fixedExpenses } = useFixedExpenses();
  const addFixed = useAddFixedExpense();
  const deleteFixed = useDeleteFixedExpense();
  const updateFixed = useUpdateFixedExpense();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("אחר");
  const [chargeDay, setChargeDay] = useState("1");

  const handleSave = () => {
    if (!name || !amount || Number(amount) <= 0) {
      toast.error("הזן שם וסכום");
      return;
    }
    addFixed.mutate(
      { name, amount: Number(amount), category, charge_day: Number(chargeDay) },
      {
        onSuccess: () => {
          toast.success("הוצאה קבועה נשמרה");
          setDrawerOpen(false);
          setName("");
          setAmount("");
          setCategory("אחר");
          setChargeDay("1");
        },
        onError: () => toast.error("שגיאה בשמירה"),
      }
    );
  };

  const toggleActive = (id: string, current: boolean) => {
    updateFixed.mutate({ id, is_active: !current });
  };

  const totalActive = (fixedExpenses || []).filter(f => f.is_active).reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-finance" />
          <h3 className="text-sm font-semibold text-muted-foreground">הוצאות קבועות</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">סה״כ: ₪{fmtNum(totalActive)}</span>
          <button onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg bg-finance/10 text-finance hover:bg-finance/20 transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {(!fixedExpenses || fixedExpenses.length === 0) ? (
        <p className="text-xs text-muted-foreground text-center py-4">אין הוצאות קבועות — הוסף שכירות, מנויים ועוד</p>
      ) : (
        <div className="space-y-2">
          {fixedExpenses.map((f: any) => (
            <div key={f.id} className={`flex items-center justify-between p-2.5 rounded-xl transition-colors group ${f.is_active ? "bg-secondary/20" : "bg-secondary/10 opacity-50"}`}>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground">{f.category} · יום {f.charge_day}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-rose-400" dir="ltr">₪{fmtNum(Number(f.amount))}</span>
                <button onClick={() => toggleActive(f.id, f.is_active)} className="text-muted-foreground hover:text-foreground p-1">
                  {f.is_active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
                <button onClick={() => deleteFixed.mutate(f.id, { onSuccess: () => toast.success("נמחק") })}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 transition-all">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddItemDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="הוסף הוצאה קבועה">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">שם</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="שכירות, נטפליקס..."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">סכום (₪)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance" dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">קטגוריה</label>
            <div className="grid grid-cols-3 gap-2">
              {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
                <button key={cat.name} onClick={() => setCategory(cat.name)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl border text-[10px] font-medium transition-colors ${
                    category === cat.name ? "border-finance bg-finance/10 text-finance" : "border-border bg-card text-foreground"
                  }`}>
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">יום חיוב בחודש</label>
            <input type="number" min="1" max="31" value={chargeDay} onChange={(e) => setChargeDay(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance" dir="ltr" />
          </div>
          <button onClick={handleSave} disabled={addFixed.isPending}
            className="w-full py-3 rounded-xl bg-finance text-finance-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {addFixed.isPending ? "שומר..." : "שמור"}
          </button>
        </div>
      </AddItemDrawer>
    </div>
  );
}
