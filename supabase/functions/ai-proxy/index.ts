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
    const { prompt, imageBase64, mimeType } = body;

    if (!prompt) return errResponse("prompt is required", 400);
    if (imageBase64 && imageBase64.length > 5_000_000) return errResponse("התמונה גדולה מדי — הקטן אותה ונסה שוב", 413);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return errResponse("OPENAI_API_KEY not set");

    const isVision = !!imageBase64;
    const dataUrl = isVision
      ? (imageBase64.startsWith("data:") ? imageBase64 : `data:${mimeType ?? "image/jpeg"};base64,${imageBase64}`)
      : null;

    const content = isVision
      ? [
          { type: "image_url", image_url: { url: dataUrl } },
          { type: "text", text: prompt },
        ]
      : prompt;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);

    let res: Response;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        signal: controller.signal,
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: isVision ? "gpt-4o" : "gpt-4o-mini",
          messages: [{ role: "user", content }],
          temperature: isVision ? 0.1 : 0.4,
        }),
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const t = await res.text();
      console.error("OpenAI error:", res.status, t);
      if (res.status === 429) return errResponse("יותר מדי בקשות, נסה שוב", 429);
      return errResponse(`שגיאת AI (${res.status})`, 502);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-proxy error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return errResponse(msg.includes("aborted") ? "הבקשה ארכה יותר מדי — נסה שוב" : msg);
  }
});
