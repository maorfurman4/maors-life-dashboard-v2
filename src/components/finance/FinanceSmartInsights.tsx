import { Brain, TrendingDown, TrendingUp, AlertTriangle, Award } from "lucide-react";
import { useMonthlyFinance, useExpenseHistory, useIncomeHistory } from "@/hooks/use-finance-data";
import { useMemo } from "react";

const fmtNum = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

function computeFinancialScore(fin: ReturnType<typeof useMonthlyFinance>): number {
  let score = 50;

  // Savings performance (max 30 pts)
  if (fin.totalIncome > 0) {
    const savingsRatio = fin.savingsPct / fin.savingsGoal;
    score += Math.min(savingsRatio * 30, 30);
  }

  // Fixed expenses ratio (max 10 pts) - lower is better
  if (fin.totalIncome > 0) {
    const fixedRatio = fin.totalFixedMonthly / fin.totalIncome;
    score += fixedRatio < 0.3 ? 10 : fixedRatio < 0.5 ? 5 : 0;
  }

  // Forecast positive (max 10 pts)
  if (fin.forecastBalance > 0) score += 5;
  if (fin.forecastSavingsPct >= fin.savingsGoal) score += 5;

  return Math.min(Math.max(Math.round(score), 0), 100);
}

export function FinanceSmartInsights() {
  const now = new Date();
  const fin = useMonthlyFinance(now.getFullYear(), now.getMonth() + 1);
  const { data: expHistory } = useExpenseHistory(3);

  const { anomalies, financialScore, streakMonths } = useMemo(() => {
    const score = computeFinancialScore(fin);
    const anomalies: { cat: string; current: number; avg: number; pctDiff: number }[] = [];

    // Compare current month categories to 3-month avg
    if (expHistory?.length) {
      const prevMonthMap: Record<string, number[]> = {};
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      for (const e of expHistory) {
        const m = e.date.slice(0, 7);
        if (m === currentMonth) continue;
        if (!prevMonthMap[e.category]) prevMonthMap[e.category] = [];
        prevMonthMap[e.category].push(Number(e.amount));
      }

      for (const [cat, spent] of Object.entries(fin.categoryBreakdown)) {
        const prevAmounts = prevMonthMap[cat];
        if (prevAmounts && prevAmounts.length > 0) {
          const avg = prevAmounts.reduce((s, v) => s + v, 0) / Math.max(prevAmounts.length / 30 * (now.getDate()), 1);
          // Simplified: compare total for the category
          const prevTotal = prevAmounts.reduce((s, v) => s + v, 0);
          const prevMonths = new Set(expHistory.filter(e => e.category === cat && e.date.slice(0, 7) !== currentMonth).map(e => e.date.slice(0, 7))).size;
          const monthlyAvg = prevMonths > 0 ? prevTotal / prevMonths : 0;

          if (monthlyAvg > 0) {
            const pctDiff = ((spent - monthlyAvg) / monthlyAvg) * 100;
            if (pctDiff > 30) {
              anomalies.push({ cat, current: spent, avg: monthlyAvg, pctDiff });
            }
          }
        }
      }
    }

    anomalies.sort((a, b) => b.pctDiff - a.pctDiff);

    return { anomalies, financialScore: score, streakMonths: 0 };
  }, [fin, expHistory, now]);

  const scoreColor =
    financialScore >= 80 ? "text-emerald-400" :
    financialScore >= 60 ? "text-amber-400" :
    "text-rose-400";

  const scoreLabel =
    financialScore >= 80 ? "מצוין 🌟" :
    financialScore >= 60 ? "סביר ⚡" :
    "צריך שיפור ⚠️";

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-finance" />
          <h3 className="text-sm font-semibold text-muted-foreground">Smart Insights</h3>
        </div>
      </div>

      {/* Financial Score */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/20">
        <div className="relative">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="25" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
            <circle cx="30" cy="30" r="25" fill="none" strokeWidth="4"
              strokeDasharray={`${(financialScore / 100) * 157} 157`}
              strokeLinecap="round"
              className={scoreColor.replace("text-", "stroke-")}
              style={{ stroke: financialScore >= 80 ? "#34d399" : financialScore >= 60 ? "#fbbf24" : "#f87171" }}
              transform="rotate(-90 30 30)" />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${scoreColor}`}>
            {financialScore}
          </span>
        </div>
        <div>
          <p className="text-xs font-medium">ציון כלכלי</p>
          <p className={`text-sm font-bold ${scoreColor}`}>{scoreLabel}</p>
          <p className="text-[10px] text-muted-foreground">מבוסס על חיסכון, הוצאות ותחזית</p>
        </div>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> חריגות מממוצע 3 חודשים
          </p>
          {anomalies.slice(0, 3).map((a) => (
            <div key={a.cat} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-400/10 border border-rose-400/20 text-xs">
              <span>{a.cat}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">ממוצע: ₪{fmtNum(a.avg)}</span>
                <span className="text-rose-400 font-bold">₪{fmtNum(a.current)} (+{a.pctDiff.toFixed(0)}%)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto Tips */}
      <div className="space-y-1.5">
        {fin.savingsPct >= fin.savingsGoal && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-xs text-emerald-300">
            <Award className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>כל הכבוד! עומד ביעד החיסכון של {fin.savingsGoal}%. שקול להעלות ל-{fin.savingsGoal + 5}%</span>
          </div>
        )}
        {fin.avgDailyExpense > 0 && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-400/10 border border-blue-400/20 text-xs text-blue-300">
            <TrendingDown className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>הוצאה ממוצעת ליום: ₪{fmtNum(fin.avgDailyExpense)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
