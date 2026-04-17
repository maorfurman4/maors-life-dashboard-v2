import { Briefcase, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useState, useMemo } from "react";
import { AddHoldingDrawer } from "@/components/market/AddHoldingDrawer";
import { useStockHoldings, useDeleteStockHolding } from "@/hooks/use-sport-data";
import { useStockQuotes } from "@/hooks/use-stock-quotes";
import { toast } from "sonner";

export function MarketPortfolio() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: holdings, isLoading } = useStockHoldings();
  const deleteHolding = useDeleteStockHolding();

  const symbols = useMemo(() => (holdings || []).map((h: any) => h.symbol), [holdings]);
  const { data: quotes } = useStockQuotes(symbols);
  const quoteMap = useMemo(() => {
    const m = new Map<string, any>();
    (quotes || []).forEach((q: any) => m.set(q.symbol.toUpperCase(), q));
    return m;
  }, [quotes]);

  const summary = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let dailyChange = 0;
    (holdings || []).forEach((h: any) => {
      const q = quoteMap.get(h.symbol.toUpperCase());
      const price = q?.price ?? Number(h.avg_price);
      const value = Number(h.shares) * price;
      const cost = Number(h.shares) * Number(h.avg_price);
      totalValue += value;
      totalCost += cost;
      if (q?.change != null) dailyChange += Number(h.shares) * Number(q.change);
    });
    return { totalValue, totalCost, totalPL: totalValue - totalCost, dailyChange };
  }, [holdings, quoteMap]);

  const handleDelete = (id: string) => {
    deleteHolding.mutate(id, {
      onSuccess: () => toast.success("פוזיציה נמחקה"),
      onError: (err) => toast.error("שגיאה: " + err.message),
    });
  };

  return (
    <div className="rounded-2xl border border-border overflow-hidden" style={{
      background: "linear-gradient(135deg, oklch(0.18 0.03 155), oklch(0.14 0.02 165))"
    }}>
      <div className="p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-market" />
            <span className="text-sm font-semibold text-muted-foreground">תיק ההשקעות</span>
          </div>
          <button onClick={() => setDrawerOpen(true)} className="text-[10px] text-market font-semibold hover:underline min-h-[32px]">
            + הוסף פוזיציה
          </button>
        </div>

        {!isLoading && holdings && holdings.length > 0 && (
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-card/40 border border-border">
            <div>
              <div className="text-[10px] text-muted-foreground">שווי תיק</div>
              <div className="text-sm font-bold">${summary.totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">שינוי יומי</div>
              <div className={`text-sm font-bold ${summary.dailyChange >= 0 ? "text-market" : "text-destructive"}`}>
                {summary.dailyChange >= 0 ? "+" : ""}${summary.dailyChange.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">רווח/הפסד</div>
              <div className={`text-sm font-bold ${summary.totalPL >= 0 ? "text-market" : "text-destructive"}`}>
                {summary.totalPL >= 0 ? "+" : ""}${summary.totalPL.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {isLoading && <div className="text-xs text-muted-foreground text-center py-3">טוען...</div>}

        {!isLoading && holdings && holdings.length > 0 ? (
          <div className="space-y-2">
            {holdings.map((h: any) => {
              const q = quoteMap.get(h.symbol.toUpperCase());
              const livePrice = q?.price;
              const cost = Number(h.shares) * Number(h.avg_price);
              const value = livePrice != null ? Number(h.shares) * livePrice : cost;
              const pl = value - cost;
              const plPct = cost > 0 ? (pl / cost) * 100 : 0;
              const dayPct = q?.changePercent ?? null;
              const isUp = (dayPct ?? 0) >= 0;
              return (
                <div key={h.id} className="rounded-xl border border-border bg-card/50 p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold" dir="ltr">{h.symbol}</span>
                      {dayPct != null && (
                        <span className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded ${isUp ? "bg-market/15 text-market" : "bg-destructive/15 text-destructive"}`}>
                          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {isUp ? "+" : ""}{dayPct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground mt-0.5">
                      <span>{h.shares} יח׳</span>
                      <span>ממוצע: {Number(h.avg_price).toFixed(2)}</span>
                      {livePrice != null && <span className="text-foreground font-medium">חי: {livePrice.toFixed(2)}</span>}
                      <span>שווי: {value.toLocaleString("en-US", { maximumFractionDigits: 0 })} {h.currency}</span>
                      <span className={pl >= 0 ? "text-market font-medium" : "text-destructive font-medium"}>
                        {pl >= 0 ? "+" : ""}{pl.toFixed(2)} ({plPct >= 0 ? "+" : ""}{plPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(h.id)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-destructive/10 shrink-0">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : !isLoading ? (
          <EmptyState icon={Briefcase} message="אין פוזיציות בתיק — הוסף אחזקה ראשונה"
            actionLabel="הוסף פוזיציה" onAction={() => setDrawerOpen(true)} colorClass="text-market" />
        ) : null}
      </div>
      <AddHoldingDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
