const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const errResponse = (msg: string, status = 500) =>
  new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { messages = [] } = body as { messages: ChatMessage[]; context?: object };

    if (!Array.isArray(messages) || messages.length === 0) {
      return errResponse("messages array is required", 400);
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return errResponse("OPENAI_API_KEY not set");

    const systemMessage: ChatMessage = {
      role: "system",
      content:
        "אתה עוזר אישי חכם. ענה תמיד בעברית, קצר וידידותי. אתה עוזר עם נושאי ספורט, תזונה, כסף ובריאות. אל תהיה ארוך מדי — עד 3-4 משפטים בדרך כלל.",
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      signal: controller.signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 500,
        temperature: 0.7,
        messages: [systemMessage, ...messages],
      }),
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      const text = await res.text();
      console.error("OpenAI error:", res.status, text);
      if (res.status === 429) return errResponse("יותר מדי בקשות, נסה שוב מאוחר יותר", 429);
      return errResponse(`שגיאת AI (${res.status})`, 502);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "מצטער, לא הצלחתי לענות";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-chat error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return errResponse(
      msg.includes("aborted") ? "הבקשה ארכה יותר מדי — נסה שוב" : msg
    );
  }
});
