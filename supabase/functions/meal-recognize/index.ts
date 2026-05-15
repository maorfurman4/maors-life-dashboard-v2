const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const errResponse = (msg: string, status = 500) =>
  new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM_PROMPT = `You are an expert nutritionist and food analyst.
Analyze the food visible in the image. Estimate realistic portion sizes based on visual context (plate size, utensils, etc.) when quantities are not explicit.
You MUST return ONLY a valid JSON object with exactly these five keys:
  meal_name  — string, food name in Hebrew (e.g. "חזה עוף עם אורז וירקות")
  calories   — number, total kcal for the portion shown
  protein_g  — number, grams of protein
  carbs_g    — number, grams of carbohydrates
  fat_g      — number, grams of fat
No markdown. No explanation. No extra keys. Pure JSON only.
If no food is detected in the image return exactly:
{"meal_name":"לא זוהה מזון","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { imageBase64 } = body;

    if (!imageBase64) return errResponse("missing image", 400);
    // client compresses to ≤800px — 3 MB is a safe ceiling
    if (imageBase64.length > 3_000_000) return errResponse("התמונה גדולה מדי — הקטן אותה ונסה שוב", 413);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return errResponse("OPENAI_API_KEY not set");

    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      signal: controller.signal,
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        max_tokens: 200,
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

    if (!res.ok) {
      const t = await res.text();
      console.error("OpenAI error:", res.status, t);
      if (res.status === 429) return errResponse("יותר מדי בקשות, נסה שוב בעוד דקה", 429);
      return errResponse(`שגיאת AI (${res.status})`, 502);
    }

    const data  = await res.json();
    const raw   = data?.choices?.[0]?.message?.content ?? "";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("JSON parse failed:", raw);
      return errResponse("תגובת AI לא תקינה — נסה שנית");
    }

    // map meal_name → name to keep the client-side contract stable
    const meal = {
      name:       String(parsed.meal_name ?? "ארוחה לא ידועה"),
      calories:   Number(parsed.calories  ?? 0),
      protein_g:  Number(parsed.protein_g ?? 0),
      carbs_g:    Number(parsed.carbs_g   ?? 0),
      fat_g:      Number(parsed.fat_g     ?? 0),
      items:      [] as string[],
      confidence: "medium" as const,
    };

    if (meal.name === "לא זוהה מזון" && meal.calories === 0) {
      return errResponse("לא זוהה מזון בתמונה — נסה תמונה ברורה יותר", 422);
    }

    return new Response(JSON.stringify({ meal }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("meal-recognize error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return errResponse(msg.includes("aborted") ? "הבקשה ארכה יותר מדי — נסה שוב" : msg);
  }
});
