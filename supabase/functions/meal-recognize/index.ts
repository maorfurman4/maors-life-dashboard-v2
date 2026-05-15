const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const errResponse = (msg: string, status = 500) =>
  new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM_PROMPT = `You are an expert nutritionist and food analyst specializing in Israeli cuisine.

Your task: analyze the food in this image and return a single JSON object with nutritional estimates.

Guidelines:
- Even if the image is blurry, dark, or partially unclear — make your best effort to identify the most likely food items based on shape, color, texture, and visual context. Never refuse to guess.
- Estimate realistic portion sizes using visual cues: plate diameter relative to utensils or hands, food height and spread across the plate.
- If multiple dishes are visible in one frame, analyze the entire meal as one combined entry (sum all macros).
- If a packaged product is visible, read the nutrition label when legible; otherwise estimate from the product type and visible quantity.
- For beverages visible alongside food, include their calories and macros in the total.
- Food name must be in Hebrew (e.g. "חזה עוף עם אורז וירקות").

Return ONLY this JSON structure — no markdown, no explanation, no extra keys:
{
  "meal_name": "food name in Hebrew",
  "calories":  <number — total kcal>,
  "protein_g": <number — grams of protein>,
  "carbs_g":   <number — grams of carbohydrates>,
  "fat_g":     <number — grams of fat>,
  "confidence": "high" | "medium" | "low"
}

Set confidence to "high" when food is clearly identifiable, "medium" when somewhat blurry or ambiguous portions, "low" when heavily obscured but still guessable.

Return this ONLY when absolutely no food is detectable (empty room, random object, fully black image):
{"meal_name":"לא זוהה מזון","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"confidence":"low"}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const requestId = crypto.randomUUID().slice(0, 8);
  const t0 = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const { imageBase64 } = body;

    if (!imageBase64) return errResponse("missing image", 400);

    const hasPrefix    = imageBase64.startsWith("data:");
    const payloadBytes = imageBase64.length;
    console.log(`[${requestId}] recv image — bytes=${payloadBytes} hasPrefix=${hasPrefix}`);

    // client compresses to ≤800px — 3 MB is a safe ceiling
    if (payloadBytes > 3_000_000) return errResponse("התמונה גדולה מדי — הקטן אותה ונסה שוב", 413);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return errResponse("OPENAI_API_KEY not set");

    const dataUrl = hasPrefix
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);

    console.log(`[${requestId}] calling openai model=gpt-4o`);
    const tFetch = Date.now();

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      signal: controller.signal,
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        max_tokens: 220,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              // detail:"low" — sufficient for food ID at 800px, saves tokens & latency
              { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
              { type: "text", text: "Analyze this food image and return the JSON." },
            ],
          },
        ],
      }),
    }).finally(() => clearTimeout(timer));

    const fetchMs = Date.now() - tFetch;
    console.log(`[${requestId}] openai responded status=${res.status} ms=${fetchMs}`);

    if (!res.ok) {
      const t = await res.text();
      console.error(`[${requestId}] openai error status=${res.status} body=${t}`);
      if (res.status === 429) return errResponse("יותר מדי בקשות, נסה שוב בעוד דקה", 429);
      return errResponse(`שגיאת AI (${res.status})`, 502);
    }

    const data  = await res.json();
    const raw   = data?.choices?.[0]?.message?.content ?? "";
    const usage = data?.usage;
    console.log(`[${requestId}] raw=${raw} tokens_total=${usage?.total_tokens ?? "?"}`);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error(`[${requestId}] JSON parse failed raw=${raw}`);
      return errResponse("תגובת AI לא תקינה — נסה שנית");
    }

    const confidence = (["high", "medium", "low"].includes(String(parsed.confidence))
      ? parsed.confidence
      : "medium") as "high" | "medium" | "low";

    const meal = {
      name:       String(parsed.meal_name ?? "ארוחה לא ידועה"),
      calories:   Number(parsed.calories  ?? 0),
      protein_g:  Number(parsed.protein_g ?? 0),
      carbs_g:    Number(parsed.carbs_g   ?? 0),
      fat_g:      Number(parsed.fat_g     ?? 0),
      items:      [] as string[],
      confidence,
    };

    console.log(`[${requestId}] result name="${meal.name}" cal=${meal.calories} conf=${meal.confidence} total_ms=${Date.now() - t0}`);

    if (meal.name === "לא זוהה מזון" && meal.calories === 0) {
      return errResponse("לא זוהה מזון בתמונה — נסה תמונה ברורה יותר", 422);
    }

    return new Response(JSON.stringify({ meal }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${requestId}] unhandled error ms=${Date.now() - t0} err=${msg}`);
    return errResponse(msg.includes("aborted") ? "הבקשה ארכה יותר מדי — נסה שוב" : msg);
  }
});
