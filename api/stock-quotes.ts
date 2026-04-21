// Vercel serverless function — proxies Yahoo Finance to avoid browser CORS
export default async function handler(req: any, res: any) {
  // Allow preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const symbols = req.query?.symbols as string | undefined;
  if (!symbols) return res.status(400).json({ error: "symbols query param required" });

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Yahoo Finance ${upstream.status}` });
    }

    const data = await upstream.json();
    // Cache for 60 s on CDN edge
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "proxy error" });
  }
}
