import { AlertTriangle, Shield } from "lucide-react";
import { useMonthlyFinance, DEFAULT_EXPENSE_CATEGORIES } from "@/hooks/use-finance-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fmtNum = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

function useExpenseCategories() {
  return useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function FinanceBudgetAlerts() {
  const now = new Date();
  const fin = useMonthlyFinance(now.getFullYear(), now.getMonth() + 1);
  const { data: categories } = useExpenseCategories();

  // Merge DB categories with defaults for budget limits
  const budgetMap: Record<string, number> = {};
  for (const cat of categories || []) {
    if (cat.budget_limit && cat.budget_limit > 0) {
      budgetMap[cat.name] = Number(cat.budget_limit);
    }
  }

  const alerts: { category: string; spent: number; budget: number; pct: number }[] = [];
  for (const [cat, spent] of Object.entries(fin.categoryBreakdown)) {
    const budget = budgetMap[cat];
    if (budget && budget > 0) {
      const pct = (spent / budget) * 100;
      if (pct >= 70) {
        alerts.push({ category: cat, spent, budget, pct });
      }
    }
  }

  if (alerts.length === 0 && Object.keys(budgetMap).length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-finance" />
        <h3 className="text-sm font-semibold text-muted-foreground">תקציב לפי קטגוריה</h3>
      </div>

      {alerts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">כל הקטגוריות בגבולות התקציב ✅</p>
      ) : (
        <div className="space-y-2">
          {alerts.sort((a, b) => b.pct - a.pct).map((a) => {
            const icon = DEFAULT_EXPENSE_CATEGORIES.find(c => c.name === a.category)?.icon || "📦";
            const isOver = a.pct >= 100;
            return (
              <div key={a.category} className={`p-2.5 rounded-xl border text-xs ${
                isOver ? "bg-rose-400/10 border-rose-400/20" : "bg-amber-400/10 border-amber-400/20"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium">{icon} {a.category}</span>
                  <span className={isOver ? "text-rose-400 font-bold" : "text-amber-400"}>
                    {isOver ? "חריגה!" : "מתקרב"} {a.pct.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-secondary/30 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${isOver ? "bg-rose-400" : "bg-amber-400"}`}
                    style={{ width: `${Math.min(a.pct, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  <span>₪{fmtNum(a.spent)} / ₪{fmtNum(a.budget)}</span>
                  <span>נותר: ₪{fmtNum(Math.max(a.budget - a.spent, 0))}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
