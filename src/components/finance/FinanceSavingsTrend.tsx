import { TrendingUp } from "lucide-react";
import { useExpenseHistory, useIncomeHistory } from "@/hooks/use-finance-data";
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { motion } from "framer-motion";
import { formatAmount } from "@/utils/format-currency";

const fmtNum = formatAmount;

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
    <motion.div
      className="rounded-2xl bg-card border border-border p-5 space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-finance" />
        <h3 className="text-sm font-semibold text-muted-foreground">מגמת חיסכון — 6 חודשים</h3>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} width={40} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}
              itemStyle={{ color: "#fff" }}
              formatter={(v: number, name: string) => {
                if (name === "savingsPct") return [`${v}%`, "% חיסכון"];
                return [`₪${fmtNum(v)}`, name === "income" ? "הכנסות" : name === "expense" ? "הוצאות" : "חיסכון"];
              }}
            />
            <ReferenceLine y={35} stroke="rgba(244,226,140,0.5)" strokeDasharray="5 5" label={{ value: "יעד 35%", fill: "rgba(244,226,140,0.6)", fontSize: 10 }} />
            <Line type="monotone" dataKey="savingsPct" stroke="hsl(145, 80%, 50%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(145,80%,50%)" }} name="savingsPct" />
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
    </motion.div>
  );
}
