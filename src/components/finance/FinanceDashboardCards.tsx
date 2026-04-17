import { useMonthlyFinance } from "@/hooks/use-finance-data";
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3, PiggyBank, Target, Wallet, ArrowUpRight } from "lucide-react";

const fmtNum = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

export function FinanceDashboardCards() {
  const now = new Date();
  const fin = useMonthlyFinance(now.getFullYear(), now.getMonth() + 1);

  const cards = [
    { label: "הכנסות", value: `₪${fmtNum(fin.totalIncome)}`, icon: ArrowUpRight, accent: "text-emerald-400" },
    { label: "הוצאות", value: `₪${fmtNum(fin.totalExpenses)}`, icon: TrendingDown, accent: "text-rose-400" },
    { label: "חיסכון", value: `₪${fmtNum(fin.savings)}`, icon: PiggyBank, accent: "text-finance" },
    { label: "% חיסכון", value: `${fin.savingsPct.toFixed(1)}%`, icon: Target, accent: fin.savingsPct >= fin.savingsGoal ? "text-emerald-400" : "text-amber-400" },
    { label: "יעד חיסכון", value: `${fin.savingsGoal}%`, icon: Target, accent: "text-muted-foreground" },
    { label: "תחזית סוף חודש", value: `₪${fmtNum(fin.forecastBalance)}`, icon: Calendar, accent: fin.forecastBalance >= 0 ? "text-emerald-400" : "text-rose-400" },
    { label: "מאזן נוכחי", value: `₪${fmtNum(fin.balance)}`, icon: Wallet, accent: fin.balance >= 0 ? "text-emerald-400" : "text-rose-400" },
    { label: "הוצאה ממוצעת/יום", value: `₪${fmtNum(fin.avgDailyExpense)}`, icon: BarChart3, accent: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl bg-card border border-border p-3 space-y-1">
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
