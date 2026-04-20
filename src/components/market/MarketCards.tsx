import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useStockQuotes } from "@/hooks/use-stock-quotes";

interface IndexDef {
  symbol: string;
  label: string;
  flag?: string;
}

const INDICES: IndexDef[] = [
  { symbol: "^GSPC",    label: "S&P 500",    flag: "🇺🇸" },
  { symbol: "^IXIC",    label: 'נאסד"ק',     flag: "🇺🇸" },
  { symbol: "^DJI",     label: "דאו ג'ונס",  flag: "🇺🇸" },
  { symbol: "^TA125.TA",label: 'ת"א 125',    flag: "🇮🇱" },
  { symbol: "GC=F",     label: "זהב",         flag: "🥇" },
  { symbol: "BTC-USD",  label: "ביטקוין",     flag: "₿" },
];

function fmt(n: number | null, currency = ""): string {
  if (n == null) return "—";
  if (n >= 10_000) return currency + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 100)   return currency + n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  return currency + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function MarketCards() {
  const symbols = useMemo(() => INDICES.map((i) => i.symbol), []);
  const { data: quotes, isLoading } = useStockQuotes(symbols);

  const quoteMap = useMemo(() => {
    const m = new Map<string, any>();
    (quotes || []).forEach((q) => m.set(q.symbol.toUpperCase(), q));
    return m;
  }, [quotes]);

  return (
    <div className="space-y-2" dir="rtl">
      <p className="text-xs font-semibold text-muted-foreground px-1">מדדים עולמיים</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {INDICES.map(({ symbol, label, flag }) => {
          const q = quoteMap.get(symbol.toUpperCase());
          const chg = q?.changePercent ?? null;
          const isUp   = chg != null && chg > 0;
          const isDown = chg != null && chg < 0;
          const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

          return (
            <div
              key={symbol}
              className={`rounded-xl border p-3 space-y-1 transition-colors ${
                isUp   ? "border-market/20 bg-market/5" :
                isDown ? "border-destructive/20 bg-destructive/5" :
                         "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {flag} {label}
                </span>
                {isLoading ? (
                  <div className="h-3 w-3 rounded-full bg-secondary/50 animate-pulse" />
                ) : (
                  <Icon className={`h-3 w-3 ${isUp ? "text-market" : isDown ? "text-destructive" : "text-muted-foreground"}`} />
                )}
              </div>

              {isLoading ? (
                <div className="h-5 w-20 rounded bg-secondary/40 animate-pulse" />
              ) : (
                <p className="text-sm font-bold" dir="ltr">
                  {fmt(q?.price ?? null)}
                </p>
              )}

              {!isLoading && chg != null && (
                <p className={`text-[10px] font-semibold ${isUp ? "text-market" : "text-destructive"}`} dir="ltr">
                  {isUp ? "+" : ""}{chg.toFixed(2)}%
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
