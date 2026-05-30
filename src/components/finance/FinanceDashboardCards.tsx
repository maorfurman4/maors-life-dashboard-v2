import { useMemo } from "react";
import { useMonthlyFinance, useExpenseEntries, useIncomeEntries } from "@/hooks/use-finance-data";
import { TrendingDown, Calendar, BarChart3, PiggyBank, Target, Wallet, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAmount } from "@/utils/format-currency";

export function FinanceDashboardCards() {
  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { isLoading: expLoading } = useExpenseEntries(year, month);
  const { isLoading: incLoading } = useIncomeEntries(year, month);
  const isLoading = expLoading || incLoading;

  const fin = useMonthlyFinance(year, month);

  const cards = useMemo(() => [
    { label: "הכנסות",           value: `₪${formatAmount(fin.totalIncome)}`,      icon: ArrowUpRight, accent: "text-emerald-400" },
    { label: "הוצאות",           value: `₪${formatAmount(fin.totalExpenses)}`,     icon: TrendingDown,  accent: "text-rose-400" },
    { label: "חיסכון",           value: `₪${formatAmount(fin.savings)}`,           icon: PiggyBank,     accent: "text-finance" },
    { label: "% חיסכון",         value: `${fin.savingsPct.toFixed(1)}%`,           icon: Target,        accent: fin.savingsPct >= fin.savingsGoal ? "text-emerald-400" : "text-amber-400" },
    { label: "יעד חיסכון",       value: `${fin.savingsGoal}%`,                    icon: Target,        accent: "text-muted-foreground" },
    { label: "תחזית סוף חודש",   value: `₪${formatAmount(fin.forecastBalance)}`,  icon: Calendar,      accent: fin.forecastBalance >= 0 ? "text-emerald-400" : "text-rose-400" },
    { label: "מאזן נוכחי",       value: `₪${formatAmount(fin.balance)}`,           icon: Wallet,        accent: fin.balance >= 0 ? "text-emerald-400" : "text-rose-400" },
    { label: "הוצאה ממוצעת/יום", value: `₪${formatAmount(fin.avgDailyExpense)}`,  icon: BarChart3,     accent: "text-muted-foreground" },
  ], [fin]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card border border-border p-3 space-y-2">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-5 w-1/2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl bg-card border border-border p-3 space-y-1 transition-colors hover:bg-white/5"
        >
          <div className="flex items-center gap-1.5">
            <card.icon className={`h-3.5 w-3.5 ${card.accent} shrink-0`} />
            <p className="text-[10px] text-muted-foreground">{card.label}</p>
          </div>
          <p className={`text-sm font-bold ${card.accent}`} dir="ltr">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
