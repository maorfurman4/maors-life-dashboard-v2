import { useState } from "react";
import { CreditCard, Plus, Trash2, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { useFixedExpenses, useAddFixedExpense, useDeleteFixedExpense, useUpdateFixedExpense, DEFAULT_EXPENSE_CATEGORIES } from "@/hooks/use-finance-data";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { toast } from "sonner";

const fmtNum = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

export function FinanceSubscriptions() {
  const { data: fixedExpenses } = useFixedExpenses();
  const addFixed = useAddFixedExpense();
  const deleteFixed = useDeleteFixedExpense();
  const updateFixed = useUpdateFixedExpense();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("מנויים");
  const [chargeDay, setChargeDay] = useState("1");

  const subscriptions = (fixedExpenses || []).filter((f: any) => f.is_recurring);
  const totalActive = subscriptions.filter((f: any) => f.is_active).reduce((s: number, f: any) => s + Number(f.amount), 0);

  const openEdit = (f: any) => {
    setEditId(f.id);
    setName(f.name);
    setAmount(String(f.amount));
    setCategory(f.category);
    setChargeDay(String(f.charge_day));
    setDrawerOpen(true);
  };

  const resetForm = () => {
    setEditId(null);
    setName("");
    setAmount("");
    setCategory("מנויים");
    setChargeDay("1");
  };

  const handleSave = () => {
    if (!name || !amount || Number(amount) <= 0) {
      toast.error("הזן שם וסכום");
      return;
    }
    if (editId) {
      updateFixed.mutate(
        { id: editId, name, amount: Number(amount), category, charge_day: Number(chargeDay) },
        {
          onSuccess: () => { toast.success("עודכן"); setDrawerOpen(false); resetForm(); },
          onError: () => toast.error("שגיאה"),
        }
      );
    } else {
      addFixed.mutate(
        { name, amount: Number(amount), category, charge_day: Number(chargeDay), is_recurring: true },
        {
          onSuccess: () => { toast.success("מנוי נוסף"); setDrawerOpen(false); resetForm(); },
          onError: () => toast.error("שגיאה"),
        }
      );
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-finance" />
          <h3 className="text-sm font-semibold text-muted-foreground">מנויים חודשיים</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">סה״כ: ₪{fmtNum(totalActive)}/חודש</span>
          <button onClick={() => { resetForm(); setDrawerOpen(true); }}
            className="p-1.5 rounded-lg bg-finance/10 text-finance hover:bg-finance/20 transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">אין מנויים — הוסף נטפליקס, ג׳ים ועוד</p>
      ) : (
        <div className="space-y-2">
          {subscriptions.map((f: any) => (
            <div key={f.id} className={`flex items-center justify-between p-3 rounded-xl group transition-colors ${f.is_active ? "bg-secondary/20" : "bg-secondary/10 opacity-50"}`}>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground">{f.category} · יום {f.charge_day}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-rose-400" dir="ltr">₪{fmtNum(Number(f.amount))}</span>
                <button onClick={() => openEdit(f)} className="p-1 text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3 w-3" />
                </button>
                <button onClick={() => updateFixed.mutate({ id: f.id, is_active: !f.is_active })} className="p-1">
                  {f.is_active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button onClick={() => deleteFixed.mutate(f.id, { onSuccess: () => toast.success("נמחק") })}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddItemDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); resetForm(); }} title={editId ? "ערוך מנוי" : "הוסף מנוי"}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">שם</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="נטפליקס, ג׳ים..."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">סכום (₪)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance" dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">יום חיוב</label>
            <input type="number" min="1" max="31" value={chargeDay} onChange={(e) => setChargeDay(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-finance" dir="ltr" />
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
          <button onClick={handleSave} disabled={addFixed.isPending || updateFixed.isPending}
            className="w-full py-3 rounded-xl bg-finance text-finance-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50">
            {editId ? "עדכן" : "שמור"}
          </button>
        </div>
      </AddItemDrawer>
    </div>
  );
}
