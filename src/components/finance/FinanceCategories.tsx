import { PieChart as PieChartIcon } from "lucide-react";
import { useMonthlyFinance, DEFAULT_EXPENSE_CATEGORIES } from "@/hooks/use-finance-data";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "hsl(45, 80%, 55%)",   // gold
  "hsl(200, 70%, 50%)",  // blue
  "hsl(340, 65%, 55%)",  // rose
  "hsl(160, 60%, 45%)",  // green
  "hsl(270, 50%, 55%)",  // purple
  "hsl(30, 70%, 50%)",   // orange
  "hsl(180, 50%, 45%)",  // teal
  "hsl(0, 65%, 55%)",    // red
  "hsl(120, 40%, 50%)",  // lime
  "hsl(60, 50%, 50%)",   // yellow
];

const fmtNum = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

export function FinanceCategories() {
  const now = new Date();
  const fin = useMonthlyFinance(now.getFullYear(), now.getMonth() + 1);

  const chartData = Object.entries(fin.categoryBreakdown)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-finance" />
          <h3 className="text-sm font-semibold text-muted-foreground">הוצאות לפי קטגוריה</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-6">אין הוצאות עדיין — הוסף הוצאות כדי לראות חלוקה</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <PieChartIcon className="h-4 w-4 text-finance" />
        <h3 className="text-sm font-semibold text-muted-foreground">הוצאות לפי קטגוריה</h3>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={55} paddingAngle={2}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₪${fmtNum(value)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          {chartData.slice(0, 6).map((item, i) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
            const catInfo = DEFAULT_EXPENSE_CATEGORIES.find(c => c.name === item.name);
            return (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="truncate">{catInfo?.icon} {item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-muted-foreground">{pct}%</span>
                  <span className="font-medium" dir="ltr">₪{fmtNum(item.value)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 3 */}
      {chartData.length >= 2 && (
        <div className="pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground mb-1">🔥 הקטגוריות הגבוהות ביותר</p>
          <div className="flex gap-2">
            {chartData.slice(0, 3).map((item, i) => (
              <span key={item.name} className="text-[10px] px-2 py-1 rounded-lg bg-secondary/30 text-foreground">
                {i + 1}. {item.name} — ₪{fmtNum(item.value)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
