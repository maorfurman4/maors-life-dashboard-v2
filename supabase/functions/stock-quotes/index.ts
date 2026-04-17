import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { symbols } = await req.json();
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return new Response(JSON.stringify({ quotes: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const symbolList = symbols
      .filter((s) => typeof s === "string" && s.length > 0)
      .map((s) => s.toUpperCase())
      .slice(0, 50)
      .join(",");

    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolList)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Yahoo quotes API status:", res.status);
      return new Response(JSON.stringify({ quotes: [], error: `API ${res.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const quotes = (data?.quoteResponse?.result || []).map((q: any) => ({
      symbol: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice ?? null,
      change: q.regularMarketChange ?? null,
      changePercent: q.regularMarketChangePercent ?? null,
      currency: q.currency ?? "USD",
      marketState: q.marketState ?? null,
      previousClose: q.regularMarketPreviousClose ?? null,
    }));

    return new Response(JSON.stringify({ quotes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stock-quotes error:", err);
    return new Response(JSON.stringify({ quotes: [], error: (err as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
