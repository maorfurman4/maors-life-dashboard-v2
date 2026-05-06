import { ArrowUpRight, ArrowDownRight, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useState } from "react";
import { AddExpenseDrawer } from "@/components/finance/AddExpenseDrawer";
import { AddIncomeDrawer } from "@/components/finance/AddIncomeDrawer";
import { useMonthlyFinance, useDeleteExpense, useDeleteIncome } from "@/hooks/use-finance-data";
import { toast } from "sonner";

const fmtNum = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

export function FinanceTransactions() {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const now = new Date();
  const fin = useMonthlyFinance(now.getFullYear(), now.getMonth() + 1);
  const deleteExpense = useDeleteExpense();
  const deleteIncome = useDeleteIncome();

  // Merge and sort by date
  const transactions = [
    ...fin.expenses.map((e: any) => ({ ...e, _type: "expense" as const })),
    ...fin.incomes.map((i: any) => ({ ...i, _type: "income" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayedTransactions = showAll ? transactions : transactions.slice(0, 2);

  const handleDelete = (item: any) => {
    if (item._type === "expense") {
      deleteExpense.mutate(item.id, { onSuccess: () => toast.success("הוצאה נמחקה") });
    } else {
      deleteIncome.mutate(item.id, { onSuccess: () => toast.success("הכנסה נמחקה") });
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">תנועות אחרונות</h3>
        <div className="flex gap-2">
          <button onClick={() => setIncomeOpen(true)}
            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-400/10 text-emerald-400 font-medium hover:bg-emerald-400/20 transition-colors">
            + הכנסה
          </button>
          <button onClick={() => setExpenseOpen(true)}
            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-rose-400/10 text-rose-400 font-medium hover:bg-rose-400/20 transition-colors">
            + הוצאה
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={ArrowUpRight}
          message="אין תנועות עדיין"
          actionLabel="הוסף הוצאה"
          onAction={() => setExpenseOpen(true)}
          colorClass="text-finance"
        />
      ) : (
        <div className="space-y-2">
          {displayedTransactions.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors group">
              <div className="flex items-center gap-2 min-w-0">
                {item._type === "expense" ? (
                  <ArrowDownRight className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{item.description || item.category}</p>
                  <p className="text-[10px] text-muted-foreground">{item.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-bold ${item._type === "expense" ? "text-rose-400" : "text-emerald-400"}`} dir="ltr">
                  {item._type === "expense" ? "-" : "+"}₪{fmtNum(Number(item.amount))}
                </span>
                <button onClick={() => handleDelete(item)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {transactions.length > 2 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              הסתר
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              הצג הכל ({transactions.length})
            </>
          )}
        </button>
      )}

      <AddExpenseDrawer open={expenseOpen} onClose={() => setExpenseOpen(false)} />
      <AddIncomeDrawer open={incomeOpen} onClose={() => setIncomeOpen(false)} />
    </div>
  );
}
