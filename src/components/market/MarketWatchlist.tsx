import { useMemo, useState } from "react";
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, Minus, Wifi, WifiOff } from "lucide-react";
import { useWatchlist, useAddWatchlist, useDeleteWatchlist } from "@/hooks/use-market";
import { useStockQuotes } from "@/hooks/use-stock-quotes";
import { toast } from "sonner";

function LiveDot({ state }: { state: string | null }) {
  if (state === "REGULAR") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        LIVE
      </span>
    );
  }
  if (state === "PRE" || state === "POST") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        {state === "PRE" ? "טרום" : "אחרי"} שוק
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
      סגור
    </span>
  );
}

export function MarketWatchlist() {
  const { data: watchlist, isLoading } = useWatchlist();
  const addWatchlist = useAddWatchlist();
  const deleteWatchlist = useDeleteWatchlist();

  const [input, setInput] = useState("");

  const symbols = useMemo(() => (watchlist || []).map((w) => w.symbol), [watchlist]);
  const { data: quotes } = useStockQuotes(symbols);

  const quoteMap = useMemo(() => {
    const m = new Map<string, any>();
    (quotes || []).forEach((q) => m.set(q.symbol.toUpperCase(), q));
    return m;
  }, [quotes]);

  const handleAdd = () => {
    const sym = input.trim().toUpperCase();
    if (!sym) return;
    const exists = (watchlist || []).some((w) => w.symbol === sym);
    if (exists) { toast.info(`${sym} כבר ברשימת המעקב`); setInput(""); return; }
    addWatchlist.mutate(sym, {
      onSuccess: () => { toast.success(`${sym} נוסף למעקב`); setInput(""); },
      onError: () => toast.error("שגיאה בהוספה"),
    });
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-market" />
          <h3 className="text-sm font-semibold">רשימת מעקב</h3>
        </div>
        {symbols.length > 0 && (
          <span className="text-[10px] text-muted-foreground">{symbols.length} סימבולים</span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="AAPL, TEVA, ^TA125.TA..."
          className="flex-1 px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-market font-mono min-h-[40px]"
          dir="ltr"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim() || addWatchlist.isPending}
          className="h-10 w-10 rounded-xl bg-market/10 flex items-center justify-center hover:bg-market/20 transition-colors disabled:opacity-40"
        >
          <Plus className="h-4 w-4 text-market" />
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!watchlist || watchlist.length === 0) && (
        <div className="text-center py-6 space-y-1">
          <Wifi className="h-6 w-6 text-muted-foreground/30 mx-auto" />
          <p className="text-xs text-muted-foreground">הוסף סימבולים למעקב בזמן אמת</p>
        </div>
      )}

      {!isLoading && watchlist && watchlist.length > 0 && (
        <div className="space-y-2">
          {watchlist.map((item) => {
            const q = quoteMap.get(item.symbol);
            const chg = q?.changePercent ?? null;
            const isUp   = chg != null && chg > 0;
            const isDown = chg != null && chg < 0;
            const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
            const hasData = q != null;

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-secondary/10 px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" dir="ltr">{item.symbol}</span>
                    {hasData && <LiveDot state={q.marketState} />}
                  </div>
                  {q?.name && (
                    <p className="text-[10px] text-muted-foreground truncate">{q.name}</p>
                  )}
                </div>

                {hasData ? (
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" dir="ltr">
                      {q.price != null ? q.price.toFixed(2) : "—"}
                    </p>
                    {chg != null && (
                      <div className={`flex items-center justify-end gap-0.5 text-[10px] font-semibold ${isUp ? "text-market" : isDown ? "text-destructive" : "text-muted-foreground"}`}>
                        <Icon className="h-2.5 w-2.5" />
                        <span dir="ltr">{isUp ? "+" : ""}{chg.toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="shrink-0">
                    <WifiOff className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </div>
                )}

                <button
                  onClick={() => deleteWatchlist.mutate(item.id, {
                    onSuccess: () => toast.success(`${item.symbol} הוסר`),
                  })}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
