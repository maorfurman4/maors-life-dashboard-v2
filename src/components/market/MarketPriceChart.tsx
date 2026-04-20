import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useStockHoldings } from "@/hooks/use-sport-data";
import { useStockQuotes } from "@/hooks/use-stock-quotes";
import { BarChart3 } from "lucide-react";

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];

export function MarketPriceChart() {
  const { data: holdings } = useStockHoldings();
  const symbols = useMemo(() => (holdings || []).map((h: any) => h.symbol), [holdings]);
  const { data: quotes } = useStockQuotes(symbols);

  const quoteMap = useMemo(() => {
    const m = new Map<string, any>();
    (quotes || []).forEach((q) => m.set(q.symbol.toUpperCase(), q));
    return m;
  }, [quotes]);

  const plData = useMemo(() =>
    (holdings || []).map((h: any) => {
      const q = quoteMap.get(h.symbol.toUpperCase());
      const price = q?.price ?? Number(h.avg_price);
      const value = Number(h.shares) * price;
      const cost  = Number(h.shares) * Number(h.avg_price);
      const pl    = value - cost;
      const plPct = cost > 0 ? (pl / cost) * 100 : 0;
      return { symbol: h.symbol, pl, plPct };
    }).sort((a, b) => b.pl - a.pl),
  [holdings, quoteMap]);

  const allocationData = useMemo(() =>
    (holdings || []).map((h: any) => {
      const q = quoteMap.get(h.symbol.toUpperCase());
      const price = q?.price ?? Number(h.avg_price);
      const value = Number(h.shares) * price;
      return { name: h.symbol, value: Math.max(0, value) };
    }).filter((d) => d.value > 0),
  [holdings, quoteMap]);

  if (!holdings || holdings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-5" dir="rtl">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-market" />
        <h3 className="text-sm font-semibold">ניתוח ויזואלי</h3>
      </div>

      {/* P&L per holding */}
      {plData.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground">רווח/הפסד לפי נייר</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={plData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="symbol"
                tick={{ fontSize: 10, fill: "currentColor" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "P&L"]}
                cursor={{ fill: "var(--secondary)" }}
              />
              <Bar dataKey="pl" radius={[4, 4, 0, 0]}>
                {plData.map((entry, i) => (
                  <Cell key={i} fill={entry.pl >= 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Portfolio allocation pie */}
      {allocationData.length > 1 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground">הקצאת תיק</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {allocationData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend
                iconSize={8}
                formatter={(value) => <span style={{ fontSize: 10 }}>{value}</span>}
              />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, "שווי"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
