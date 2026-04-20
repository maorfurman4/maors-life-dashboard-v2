import { useEffect, useMemo, useState } from "react";
import { Bell, Plus, Trash2, BellRing, ArrowUp, ArrowDown } from "lucide-react";
import { useMarketAlerts, useAddMarketAlert, useDeleteMarketAlert, useTriggerAlert } from "@/hooks/use-market";
import { useStockQuotes } from "@/hooks/use-stock-quotes";
import { toast } from "sonner";

export function MarketAlerts() {
  const { data: alerts, isLoading } = useMarketAlerts();
  const addAlert    = useAddMarketAlert();
  const deleteAlert = useDeleteMarketAlert();
  const triggerAlert = useTriggerAlert();

  const [symbol, setSymbol]   = useState("");
  const [price, setPrice]     = useState("");
  const [dir, setDir]         = useState<"above" | "below">("above");
  const [formOpen, setFormOpen] = useState(false);

  const activeAlerts = useMemo(() => (alerts || []).filter((a) => !a.is_triggered), [alerts]);
  const triggeredAlerts = useMemo(() => (alerts || []).filter((a) => a.is_triggered), [alerts]);

  const symbols = useMemo(() => [...new Set(activeAlerts.map((a) => a.symbol))], [activeAlerts]);
  const { data: quotes } = useStockQuotes(symbols);

  const quoteMap = useMemo(() => {
    const m = new Map<string, number | null>();
    (quotes || []).forEach((q) => m.set(q.symbol.toUpperCase(), q.price));
    return m;
  }, [quotes]);

  // Auto-trigger alerts when price threshold is crossed
  useEffect(() => {
    activeAlerts.forEach((alert) => {
      const currentPrice = quoteMap.get(alert.symbol.toUpperCase());
      if (currentPrice == null) return;
      const hit =
        (alert.direction === "above" && currentPrice >= alert.target_price) ||
        (alert.direction === "below" && currentPrice <= alert.target_price);
      if (hit) {
        triggerAlert.mutate(alert.id);
        toast.success(`🔔 התראה: ${alert.symbol} עבר ${alert.target_price} (${alert.direction === "above" ? "מעל" : "מתחת"})`);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteMap]);

  const handleAdd = () => {
    if (!symbol.trim() || !price || isNaN(Number(price)) || Number(price) <= 0) {
      toast.error("מלא סימבול ומחיר תקין");
      return;
    }
    addAlert.mutate(
      { symbol: symbol.trim(), target_price: Number(price), direction: dir },
      {
        onSuccess: () => {
          toast.success("התראה נוספה");
          setSymbol(""); setPrice(""); setFormOpen(false);
        },
        onError: () => toast.error("שגיאה בשמירת התראה"),
      }
    );
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-market" />
          <h3 className="text-sm font-semibold">התראות מחיר</h3>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="h-8 w-8 rounded-xl bg-market/10 flex items-center justify-center hover:bg-market/20 transition-colors"
        >
          <Plus className="h-4 w-4 text-market" />
        </button>
      </div>

      {/* Add form */}
      {formOpen && (
        <div className="rounded-xl border border-border bg-secondary/20 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">סימבול</label>
              <input
                type="text" value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="w-full px-2.5 py-2 rounded-lg border border-border bg-card text-sm font-mono focus:outline-none focus:border-market min-h-[36px]"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">מחיר יעד</label>
              <input
                type="number" value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-2.5 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:border-market min-h-[36px]"
                dir="ltr"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["above", "below"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDir(d)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                  dir === d
                    ? d === "above" ? "border-market bg-market/10 text-market" : "border-destructive bg-destructive/10 text-destructive"
                    : "border-border text-muted-foreground"
                }`}
              >
                {d === "above" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {d === "above" ? "מעל" : "מתחת"}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            disabled={addAlert.isPending}
            className="w-full py-2.5 rounded-xl bg-market text-market-foreground font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {addAlert.isPending ? "שומר..." : "הוסף התראה"}
          </button>
        </div>
      )}

      {isLoading && <div className="text-xs text-muted-foreground text-center py-3">טוען...</div>}

      {!isLoading && activeAlerts.length === 0 && !formOpen && (
        <div className="text-center py-4 space-y-1">
          <Bell className="h-6 w-6 text-muted-foreground/30 mx-auto" />
          <p className="text-xs text-muted-foreground">הוסף התראות מחיר לניירות שאתה עוקב</p>
        </div>
      )}

      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alert) => {
            const current = quoteMap.get(alert.symbol.toUpperCase());
            const pctAway = current != null
              ? ((alert.target_price - current) / current) * 100
              : null;

            return (
              <div key={alert.id} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/10 px-3 py-2">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                  alert.direction === "above" ? "bg-market/10" : "bg-destructive/10"
                }`}>
                  {alert.direction === "above"
                    ? <ArrowUp className="h-3.5 w-3.5 text-market" />
                    : <ArrowDown className="h-3.5 w-3.5 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" dir="ltr">{alert.symbol}</span>
                    <span className={`text-[10px] font-semibold ${alert.direction === "above" ? "text-market" : "text-destructive"}`}>
                      {alert.direction === "above" ? "מעל" : "מתחת"} {alert.target_price}
                    </span>
                  </div>
                  {pctAway != null && (
                    <p className="text-[10px] text-muted-foreground" dir="ltr">
                      {Math.abs(pctAway).toFixed(1)}% {pctAway > 0 ? "מתחת" : "מעל"} ליעד
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteAlert.mutate(alert.id, { onSuccess: () => toast.success("התראה נמחקה") })}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {triggeredAlerts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground font-medium">הופעלו</p>
          {triggeredAlerts.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-secondary/10 px-3 py-2 opacity-50">
              <div className="flex items-center gap-2">
                <BellRing className="h-3.5 w-3.5 text-market" />
                <span className="text-xs font-semibold" dir="ltr">{a.symbol} @ {a.target_price}</span>
              </div>
              <button
                onClick={() => deleteAlert.mutate(a.id)}
                className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
