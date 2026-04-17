import { Lightbulb, AlertTriangle, TrendingDown, Target } from "lucide-react";
import { useMonthlyFinance } from "@/hooks/use-finance-data";

const fmtNum = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

export function FinanceInsights() {
  const now = new Date();
  const fin = useMonthlyFinance(now.getFullYear(), now.getMonth() + 1);

  const insights: { icon: typeof Lightbulb; text: string; type: "warning" | "tip" | "info" }[] = [];

  // Savings gap
  if (fin.savingsGap > 0 && fin.totalIncome > 0) {
    insights.push({
      icon: Target,
      text: `חסרים לך ₪${fmtNum(fin.savingsGap)} כדי להגיע ליעד חיסכון של ${fin.savingsGoal}%`,
      type: "warning",
    });
  }

  // Top spending category
  const cats = Object.entries(fin.categoryBreakdown).sort((a, b) => (b[1] as number) - (a[1] as number));
  if (cats.length > 0) {
    const [topCat, topVal] = cats[0];
    const pct = fin.totalExpenses > 0 ? ((topVal as number) / fin.totalExpenses * 100).toFixed(0) : "0";
    insights.push({
      icon: TrendingDown,
      text: `הקטגוריה הגבוהה ביותר: ${topCat} — ₪${fmtNum(topVal as number)} (${pct}%)`,
      type: "info",
    });
  }

  // High daily avg
  if (fin.avgDailyExpense > fin.totalIncome / fin.daysInMonth * 0.8) {
    insights.push({
      icon: AlertTriangle,
      text: `ההוצאה היומית הממוצעת (₪${fmtNum(fin.avgDailyExpense)}) גבוהה — שים לב לקצב ההוצאות`,
      type: "warning",
    });
  }

  // Variable > fixed
  if (fin.variableExpenses > fin.totalFixedMonthly && fin.totalFixedMonthly > 0) {
    insights.push({
      icon: Lightbulb,
      text: `ההוצאות המשתנות (₪${fmtNum(fin.variableExpenses)}) גבוהות מההוצאות הקבועות — בדוק אם ניתן לצמצם`,
      type: "tip",
    });
  }

  // Forecast not meeting goal
  if (fin.forecastSavingsPct < fin.savingsGoal && fin.totalIncome > 0) {
    insights.push({
      icon: AlertTriangle,
      text: `לפי התחזית, תסיים את החודש עם חיסכון של ${fin.forecastSavingsPct.toFixed(1)}% — מתחת ליעד`,
      type: "warning",
    });
  }

  if (insights.length === 0) return null;

  const typeStyles = {
    warning: "bg-rose-400/10 border-rose-400/20 text-rose-300",
    tip: "bg-amber-400/10 border-amber-400/20 text-amber-300",
    info: "bg-blue-400/10 border-blue-400/20 text-blue-300",
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-finance" />
        <h3 className="text-sm font-semibold text-muted-foreground">תובנות חכמות</h3>
      </div>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs ${typeStyles[insight.type]}`}>
            <insight.icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{insight.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
