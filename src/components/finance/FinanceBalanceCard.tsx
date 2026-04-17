import { Wallet, ArrowUpRight, ArrowDownRight, Briefcase } from "lucide-react";
import { useMonthlyFinance } from "@/hooks/use-finance-data";

const fmtNum = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

export function FinanceBalanceCard() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const fin = useMonthlyFinance(year, month);

  return (
    <div className="relative rounded-2xl p-5 md:p-6 overflow-hidden" style={{
      background: "linear-gradient(135deg, oklch(0.2 0.04 260), oklch(0.15 0.05 270), oklch(0.12 0.03 280))"
    }}>
      <div className="absolute inset-0 opacity-10" style={{
        background: "radial-gradient(circle at 80% 20%, oklch(0.7 0.12 70), transparent 60%)"
      }} />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-finance/20 flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5 text-finance" />
          </div>
          <span className="text-sm text-muted-foreground">יתרה חודשית</span>
        </div>

        <div>
          <p className={`text-3xl md:text-4xl font-bold tracking-tight ${fin.balance >= 0 ? "" : "text-destructive"}`} dir="ltr">
            ₪{fmtNum(fin.balance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {fin.totalIncome === 0 && fin.totalExpenses === 0 ? "הוסף משמרות או הכנסות כדי לראות יתרה" : "עודכן היום"}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <div className="flex-1 rounded-xl bg-white/5 p-3 space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-xs text-muted-foreground">הכנסות</span>
            </div>
            <p className="text-base md:text-lg font-bold text-emerald-400 truncate" dir="ltr">₪{fmtNum(fin.totalIncome)}</p>
            {fin.workIncome > 0 && (
              <p className="text-[10px] text-muted-foreground">מעבודה: ₪{fmtNum(fin.workIncome)}</p>
            )}
          </div>
          <div className="flex-1 rounded-xl bg-white/5 p-3 space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span className="text-xs text-muted-foreground">הוצאות</span>
            </div>
            <p className="text-base md:text-lg font-bold text-rose-400 truncate" dir="ltr">₪{fmtNum(fin.totalExpenses)}</p>
            {fin.totalFixedMonthly > 0 && (
              <p className="text-[10px] text-muted-foreground">קבועות: ₪{fmtNum(fin.totalFixedMonthly)}</p>
            )}
          </div>
        </div>

        {/* Gross/Net from work */}
        {fin.grossFromWork > 0 && (
          <div className="rounded-xl bg-white/5 p-3 space-y-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Briefcase className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="text-xs text-muted-foreground">שכר מהעבודה</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">ברוטו</span>
              <span className="font-medium" dir="ltr">₪{fmtNum(fin.grossFromWork)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">נטו</span>
              <span className="font-medium" dir="ltr">₪{fmtNum(fin.netFromWork)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
