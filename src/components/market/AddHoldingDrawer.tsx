import { useState } from "react";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { useAddStockHolding } from "@/hooks/use-sport-data";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

interface AddHoldingDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AddHoldingDrawer({ open, onClose }: AddHoldingDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [shares, setShares] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [currency, setCurrency] = useState("USD");

  const addHolding = useAddStockHolding();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("stock-search", {
        body: { query: searchQuery.trim() },
      });
      if (error) throw error;
      setSearchResults(data?.results || []);
    } catch {
      toast.error("שגיאה בחיפוש מניות");
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (r: SearchResult) => {
    setSymbol(r.symbol);
    setName(r.name);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleSave = () => {
    if (!symbol || !shares || !avgPrice || Number(shares) <= 0 || Number(avgPrice) <= 0) {
      toast.error("מלא את כל השדות");
      return;
    }
    addHolding.mutate(
      { symbol, name, shares: Number(shares), avg_price: Number(avgPrice), currency },
      {
        onSuccess: () => {
          toast.success("פוזיציה נוספה");
          onClose();
          setSymbol(""); setName(""); setShares(""); setAvgPrice(""); setSearchQuery("");
        },
        onError: () => toast.error("שגיאה בשמירה"),
      }
    );
  };

  return (
    <AddItemDrawer open={open} onClose={onClose} title="הוסף פוזיציה">
      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">חיפוש מניה</label>
          <div className="flex gap-2">
            <input type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="AAPL, Tesla, TEVA..."
              className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-market" dir="ltr" />
            <button onClick={handleSearch} disabled={searching}
              className="px-3 py-2.5 rounded-xl bg-market text-market-foreground text-xs font-medium min-h-[44px] disabled:opacity-50">
              <Search className="h-4 w-4" />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 rounded-xl border border-border bg-card max-h-40 overflow-y-auto">
              {searchResults.map((r) => (
                <button key={r.symbol} onClick={() => selectResult(r)}
                  className="w-full px-3 py-2 text-right hover:bg-secondary/40 transition-colors border-b border-border last:border-b-0">
                  <span className="text-xs font-bold" dir="ltr">{r.symbol}</span>
                  <span className="text-[10px] text-muted-foreground mr-2">{r.name}</span>
                  <span className="text-[10px] text-muted-foreground/60 mr-1">{r.exchange}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">סימבול</label>
            <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-market font-mono" dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">שם</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Apple Inc."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-market" dir="ltr" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">כמות מניות</label>
            <input type="number" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-market" dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">מחיר ממוצע</label>
            <input type="number" value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-market" dir="ltr" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">מטבע</label>
          <div className="grid grid-cols-3 gap-2">
            {["USD", "ILS", "EUR"].map((c) => (
              <button key={c} onClick={() => setCurrency(c)}
                className={`px-3 py-2 rounded-xl border transition-colors text-xs font-medium ${
                  currency === c ? "border-market bg-market/10 text-market" : "border-border bg-card hover:bg-secondary/40 text-foreground"
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={addHolding.isPending}
          className="w-full py-3 rounded-xl bg-market text-market-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {addHolding.isPending ? "שומר..." : "שמור פוזיציה"}
        </button>
      </div>
    </AddItemDrawer>
  );
}
