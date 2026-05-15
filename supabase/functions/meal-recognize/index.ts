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

Analyze the food in this image. Use the report_meal function to return your analysis.

Guidelines:
- Even if the image is blurry, dark, or partially unclear — make your best effort to identify the most likely food items. Never refuse to guess.
- Estimate realistic portion sizes using visual cues: plate diameter relative to utensils or hands, food height and spread.
- If multiple dishes are visible, analyze the entire meal as one combined entry (sum all macros).
- If a packaged product is visible, read the nutrition label when legible; otherwise estimate from product type and visible quantity.
- For beverages visible alongside food, include their calories and macros in the total.
- meal_name must be in Hebrew (e.g. "חזה עוף עם אורז וירקות").
- Set no_food to true ONLY when absolutely no food is detectable (empty room, random objects, fully black image).
- Set confidence to "high" when food is clearly identifiable, "medium" when somewhat blurry or ambiguous, "low" when heavily obscured but still guessable.`;

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
                no_food:    { type: "boolean", description: "true only when absolutely no food is visible" },
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
      name:       String(parsed.meal_name ?? "ארוחה לא ידועה"),
      calories:   Number(parsed.calories  ?? 0),
      protein_g:  Number(parsed.protein_g ?? 0),
      carbs_g:    Number(parsed.carbs_g   ?? 0),
      fat_g:      Number(parsed.fat_g     ?? 0),
      items:      [] as string[],
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
