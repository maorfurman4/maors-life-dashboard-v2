import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { prompt, imageBase64, mimeType } = await req.json();

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");
    if (!prompt) throw new Error("prompt is required");

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

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: isVision ? "gpt-4o" : "gpt-4o-mini",
        messages: [{ role: "user", content }],
        temperature: isVision ? 0.1 : 0.4,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      if (res.status === 429) return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`OpenAI ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-proxy error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
