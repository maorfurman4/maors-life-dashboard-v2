const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const errResponse = (msg: string, status = 500) =>
  new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM_PROMPT = `You are a clinical nutritionist with access to USDA and Israeli food databases. Your job is to calculate calories and macros with maximum precision — NOT to guess holistically.

Follow these exact steps:

STEP 1 — LIST COMPONENTS
Identify every food item visible in the image. For each item, estimate its weight in grams using visual cues:
- A standard dinner plate is ~26cm diameter. Use utensils, hands, or plate rim as scale references.
- Judge food height (stacked rice vs thin layer) and spread area.
- Include beverages if visible alongside food.

STEP 2 — APPLY USDA REFERENCE VALUES PER 100g
For each component, use these known nutritional values (do NOT deviate from these reference points):
- חזה עוף מבושל/אפוי: 165 קל׳, חלבון 31g, פחמימות 0g, שומן 3.6g
- שוק עוף מבושל (עם עור): 245 קל׳, חלבון 27g, פחמימות 0g, שומן 15g
- בשר בקר טחון (90% רזה): 215 קל׳, חלבון 26g, פחמימות 0g, שומן 12g
- סטייק בקר רזה (סינטה): 200 קל׳, חלבון 28g, פחמימות 0g, שומן 9g
- פילה סלמון: 208 קל׳, חלבון 20g, פחמימות 0g, שומן 13g
- טונה (קופסה, במים): 116 קל׳, חלבון 26g, פחמימות 0g, שומן 1g
- ביצה שלמה (גודל L ~60g): 85 קל׳, חלבון 7g, פחמימות 0.6g, שומן 5.5g
- אורז לבן מבושל: 130 קל׳, חלבון 2.7g, פחמימות 28g, שומן 0.3g
- פסטה מבושלת: 131 קל׳, חלבון 5g, פחמימות 25g, שומן 1g
- לחם לבן (פרוסה ~30g): 80 קל׳, חלבון 2.5g, פחמימות 15g, שומן 1g
- פיתה (1 יחידה ~60g): 165 קל׳, חלבון 5.5g, פחמימות 33g, שומן 0.7g
- תפוח אדמה מבושל: 86 קל׳, חלבון 1.8g, פחמימות 20g, שומן 0.1g
- גזר גולמי: 41 קל׳, חלבון 0.9g, פחמימות 10g, שומן 0.2g
- עגבנייה: 18 קל׳, חלבון 0.9g, פחמימות 3.9g, שומן 0.2g
- מלפפון: 16 קל׳, חלבון 0.7g, פחמימות 3.6g, שומן 0.1g
- חסה: 15 קל׳, חלבון 1.4g, פחמימות 2.9g, שומן 0.2g
- שמן זית/שמן (1 כף = 14g): 120 קל׳, חלבון 0g, פחמימות 0g, שומן 14g
- חמאה (1 כף = 14g): 100 קל׳, חלבון 0.1g, פחמימות 0g, שומן 11.5g
- גבינה צהובה (צ׳דר): 402 קל׳, חלבון 25g, פחמימות 1.3g, שומן 33g
- קוטג׳ 5%: 85 קל׳, חלבון 11g, פחמימות 3.4g, שומן 3g
- יוגורט 3%: 61 קל׳, חלבון 3.5g, פחמימות 4.7g, שומן 3g
- חומוס (מוכן): 166 קל׳, חלבון 9g, פחמימות 27g, שומן 3g
- עדשים מבושלות: 116 קל׳, חלבון 9g, פחמימות 20g, שומן 0.4g
- אבוקדו: 160 קל׳, חלבון 2g, פחמימות 9g, שומן 15g
- בננה: 89 קל׳, חלבון 1.1g, פחמימות 23g, שומן 0.3g
For foods not listed — use the closest USDA equivalent and apply same precision.

STEP 3 — CALCULATE
Multiply each component's weight × (reference per 100g ÷ 100), then sum all components.

STEP 4 — REPORT
Call report_meal with:
- meal_name in Hebrew describing the full meal
- The mathematically summed totals for calories, protein_g, carbs_g, fat_g
- portion_grams: total estimated gram weight of all food combined
- confidence: "high" if food clearly identified, "medium" if somewhat ambiguous, "low" if heavily obscured
- no_food: true ONLY when absolutely no food is visible (empty room, random objects, black image)

Never refuse to analyze. Even blurry images must produce a best-effort calculation.`;


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
        max_tokens: 300,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
              { type: "text", text: "Analyze this food image and call report_meal with your findings." },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_meal",
            description: "Report the identified meal with nutritional data in Hebrew",
            parameters: {
              type: "object",
              properties: {
                meal_name:  { type: "string",  description: "שם האוכל בעברית" },
                calories:   { type: "number",  description: "קלוריות כוללות" },
                protein_g:  { type: "number",  description: "חלבון בגרמים" },
                carbs_g:    { type: "number",  description: "פחמימות בגרמים" },
                fat_g:      { type: "number",  description: "שומן בגרמים" },
                confidence: { type: "string",  enum: ["high", "medium", "low"] },
                no_food:       { type: "boolean", description: "true only when absolutely no food is visible" },
                portion_grams: { type: "number",  description: "total estimated gram weight of all food combined" },
              },
              required: ["meal_name", "calories", "protein_g", "carbs_g", "fat_g", "confidence", "no_food"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_meal" } },
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

    const data     = await res.json();
    const usage    = data?.usage;
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error(`[${requestId}] no tool call in response`);
      return errResponse("תגובת AI לא תקינה — נסה שנית");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error(`[${requestId}] JSON parse failed args=${toolCall.function.arguments}`);
      return errResponse("תגובת AI לא תקינה — נסה שנית");
    }

    console.log(`[${requestId}] parsed=${JSON.stringify(parsed)} tokens=${usage?.total_tokens ?? "?"} total_ms=${Date.now() - t0}`);

    if (parsed.no_food) {
      return errResponse("לא זוהה מזון בתמונה — נסה תמונה ברורה יותר", 422);
    }

    const confidence = (["high", "medium", "low"].includes(String(parsed.confidence))
      ? parsed.confidence
      : "medium") as "high" | "medium" | "low";

    const meal = {
      name:          String(parsed.meal_name    ?? "ארוחה לא ידועה"),
      calories:      Number(parsed.calories     ?? 0),
      protein_g:     Number(parsed.protein_g    ?? 0),
      carbs_g:       Number(parsed.carbs_g      ?? 0),
      fat_g:         Number(parsed.fat_g        ?? 0),
      portion_grams: Number(parsed.portion_grams ?? 0),
      items:         [] as string[],
      confidence,
    };

    return new Response(JSON.stringify({ meal }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${requestId}] unhandled error ms=${Date.now() - t0} err=${msg}`);
    return errResponse(msg.includes("aborted") ? "הבקשה ארכה יותר מדי — נסה שוב" : msg);
  }
});
