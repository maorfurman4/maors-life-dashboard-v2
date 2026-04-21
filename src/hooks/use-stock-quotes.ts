import { useQuery } from "@tanstack/react-query";

export interface StockQuote {
  symbol:        string;
  name:          string;
  price:         number | null;
  change:        number | null;
  changePercent: number | null;
  currency:      string;
  marketState:   string | null;
  previousClose: number | null;
}

async function fetchYahooQuotes(symbols: string[]): Promise<StockQuote[]> {
  // Use our Vercel serverless proxy to avoid browser CORS restrictions
  const url = `/api/stock-quotes?symbols=${symbols.map(encodeURIComponent).join(",")}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`stock-quotes proxy ${res.status}`);
  const data = await res.json();
  const results = data?.quoteResponse?.result ?? [];
  return results.map((q: any): StockQuote => ({
    symbol:        q.symbol,
    name:          q.longName || q.shortName || q.symbol,
    price:         q.regularMarketPrice         ?? null,
    change:        q.regularMarketChange        ?? null,
    changePercent: q.regularMarketChangePercent ?? null,
    currency:      q.currency                   ?? "USD",
    marketState:   q.marketState                ?? null,
    previousClose: q.regularMarketPreviousClose ?? null,
  }));
}

export function useStockQuotes(symbols: string[]) {
  const key = symbols.slice().sort().join(",");
  return useQuery({
    queryKey: ["stock-quotes", key],
    queryFn: async (): Promise<StockQuote[]> => {
      if (symbols.length === 0) return [];
      try {
        return await fetchYahooQuotes(symbols);
      } catch (err) {
        // CORS / network error — return [] so UI falls back to purchase price
        console.warn("stock-quotes fetch failed:", err);
        return [];
      }
    },
    enabled:         symbols.length > 0,
    refetchInterval: 60_000,
    staleTime:       30_000,
    retry:           1,
  });
}
