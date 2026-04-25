const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const errResponse = (msg: string, status = 500) =>
  new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { imageBase64 } = body;

    if (!imageBase64) return errResponse("missing image", 400);
    if (imageBase64.length > 5_000_000) return errResponse("התמונה גדולה מדי — הקטן אותה ונסה שוב", 413);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return errResponse("OPENAI_API_KEY not set");

    const dataUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      signal: controller.signal,
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "אתה תזונאי AI. נתחו תמונות ארוחות והערכת ערכים תזונתיים. תמיד החזר תוצאות בעברית.",
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: "זהה את כל המאכלים בתמונה והערך כמויות וערכים תזונתיים כוללים לארוחה. החזר JSON בלבד." },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_meal",
            description: "Report identified meal nutrition",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "שם הארוחה בעברית, למשל: חזה עוף עם אורז וירקות" },
                items: { type: "array", items: { type: "string" }, description: "רשימת המאכלים שזוהו" },
                calories: { type: "number" },
                protein_g: { type: "number" },
                carbs_g: { type: "number" },
                fat_g: { type: "number" },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
              },
              required: ["name", "items", "calories", "protein_g", "carbs_g", "fat_g", "confidence"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_meal" } },
      }),
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      const t = await res.text();
      console.error("OpenAI error:", res.status, t);
      if (res.status === 429) return errResponse("יותר מדי בקשות, נסה שוב בעוד דקה", 429);
      return errResponse(`שגיאת AI (${res.status})`, 502);
    }

    const data = await res.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!args) return errResponse("לא הצלחתי לזהות ארוחה בתמונה");

    return new Response(JSON.stringify({ meal: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("meal-recognize error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return errResponse(msg.includes("aborted") ? "הבקשה ארכה יותר מדי — נסה שוב" : msg);
  }
});
