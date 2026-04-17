import { PiggyBank, Target, TrendingUp, TrendingDown } from "lucide-react";
import { useMonthlyFinance } from "@/hooks/use-finance-data";
import { Progress } from "@/components/ui/progress";

const fmtNum = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

export function FinanceSavings() {
  const now = new Date();
  const fin = useMonthlyFinance(now.getFullYear(), now.getMonth() + 1);

  const statusLabels = {
    on_target: { text: "עומד ביעד 🎯", color: "text-emerald-400" },
    close: { text: "קרוב ליעד ⚡", color: "text-amber-400" },
    far: { text: "רחוק מהיעד ⚠️", color: "text-rose-400" },
  };

  const status = statusLabels[fin.savingsStatus];
  const progressValue = Math.min(fin.savingsPct, 100);

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-4 w-4 text-finance" />
          <h3 className="text-sm font-semibold text-muted-foreground">חיסכון</h3>
        </div>
        <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>יעד: {fin.savingsGoal}%</span>
          <span>{fin.savingsPct.toFixed(1)}%</span>
        </div>
        <Progress value={progressValue} className="h-3" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-secondary/30 p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">נחסך</p>
          <p className="text-sm font-bold" dir="ltr">₪{fmtNum(fin.savings)}</p>
        </div>
        <div className="rounded-xl bg-secondary/30 p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">יעד</p>
          <p className="text-sm font-bold" dir="ltr">₪{fmtNum(fin.savingsTarget)}</p>
        </div>
        <div className="rounded-xl bg-secondary/30 p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">{fin.savingsGap > 0 ? "חסר" : "עודף"}</p>
          <p className={`text-sm font-bold ${fin.savingsGap > 0 ? "text-rose-400" : "text-emerald-400"}`} dir="ltr">
            ₪{fmtNum(Math.abs(fin.savingsGap))}
          </p>
        </div>
        <div className="rounded-xl bg-secondary/30 p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">% חיסכון</p>
          <p className="text-sm font-bold">{fin.savingsPct.toFixed(1)}%</p>
        </div>
      </div>

      {/* Forecast */}
      <div className="rounded-xl bg-secondary/20 border border-border p-3 space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Target className="h-3 w-3" /> תחזית סוף חודש
        </p>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">הוצאות צפויות</span>
          <span dir="ltr">₪{fmtNum(fin.forecastExpenses)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">יתרה צפויה</span>
          <span className={fin.forecastBalance >= 0 ? "text-emerald-400" : "text-rose-400"} dir="ltr">
            ₪{fmtNum(fin.forecastBalance)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">חיסכון צפוי</span>
          <span className={fin.forecastSavingsPct >= fin.savingsGoal ? "text-emerald-400" : "text-amber-400"}>
            {fin.forecastSavingsPct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
