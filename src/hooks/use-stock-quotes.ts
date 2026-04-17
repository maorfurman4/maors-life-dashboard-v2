import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StockQuote {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
  marketState: string | null;
  previousClose: number | null;
}

export function useStockQuotes(symbols: string[]) {
  const key = symbols.slice().sort().join(",");
  return useQuery({
    queryKey: ["stock-quotes", key],
    queryFn: async (): Promise<StockQuote[]> => {
      if (symbols.length === 0) return [];
      const { data, error } = await supabase.functions.invoke("stock-quotes", {
        body: { symbols },
      });
      if (error) {
        console.error("stock-quotes invoke:", error);
        return [];
      }
      return (data?.quotes as StockQuote[]) || [];
    },
    enabled: symbols.length > 0,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
