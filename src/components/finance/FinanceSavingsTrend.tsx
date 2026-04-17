import { TrendingUp } from "lucide-react";
import { useExpenseHistory, useIncomeHistory } from "@/hooks/use-finance-data";
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

const fmtNum = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

export function FinanceSavingsTrend() {
  const { data: expenseHistory } = useExpenseHistory(6);
  const { data: incomeHistory } = useIncomeHistory(6);

  const chartData = useMemo(() => {
    if (!expenseHistory?.length && !incomeHistory?.length) return [];

    const monthMap: Record<string, { income: number; expense: number }> = {};

    for (const e of incomeHistory || []) {
      const key = e.date.slice(0, 7);
      if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
      monthMap[key].income += Number(e.amount);
    }

    for (const e of expenseHistory || []) {
      const key = e.date.slice(0, 7);
      if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
      monthMap[key].expense += Number(e.amount);
    }

    return Object.entries(monthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => {
        const savings = v.income - v.expense;
        const pct = v.income > 0 ? (savings / v.income) * 100 : 0;
        const d = new Date(month + "-01");
        return {
          month: d.toLocaleDateString("he-IL", { month: "short" }),
          income: v.income,
          expense: v.expense,
          savings: Math.max(savings, 0),
          savingsPct: Math.round(pct),
        };
      });
  }, [expenseHistory, incomeHistory]);

  if (chartData.length < 2) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-finance" />
        <h3 className="text-sm font-semibold text-muted-foreground">מגמת חיסכון — 6 חודשים</h3>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={40} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number, name: string) => {
                if (name === "savingsPct") return [`${v}%`, "% חיסכון"];
                return [`₪${fmtNum(v)}`, name === "income" ? "הכנסות" : name === "expense" ? "הוצאות" : "חיסכון"];
              }}
            />
            <ReferenceLine y={35} stroke="hsl(45, 80%, 55%)" strokeDasharray="5 5" label={{ value: "יעד 35%", fill: "hsl(45, 80%, 55%)", fontSize: 10 }} />
            <Line type="monotone" dataKey="savingsPct" stroke="hsl(145, 80%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="savingsPct" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Month comparison bars */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground">הכנסות מול הוצאות</p>
        {chartData.slice(-3).map((m, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <span className="w-8 text-muted-foreground">{m.month}</span>
            <div className="flex-1 flex gap-1">
              <div className="h-3 rounded bg-emerald-400/30" style={{ width: `${m.income > 0 ? 50 : 0}%` }} />
              <div className="h-3 rounded bg-rose-400/30" style={{ width: `${m.income > 0 ? (m.expense / m.income * 50) : 0}%` }} />
            </div>
            <span className="text-emerald-400">₪{fmtNum(m.income)}</span>
            <span className="text-rose-400">₪{fmtNum(m.expense)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
