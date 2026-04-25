import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "missing image" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:${mimeType ?? "image/jpeg"};base64,${imageBase64}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "אתה מומחה OCR לקבלות ישראליות. חלץ פריטי הוצאה מהקבלה. קטגוריות: מזון, תחבורה, בריאות, בידור, קניות, חשבונות, אחר.",
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: "חלץ את פריטי ההוצאה מהקבלה. אל תכלול שורות סיכום, מע\"מ, או כותרת חנות." },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_receipt",
            description: "Report extracted receipt items",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name:     { type: "string", description: "שם המוצר/שירות בעברית" },
                      amount:   { type: "number", description: "מחיר בשקלים" },
                      category: { type: "string", enum: ["מזון", "תחבורה", "בריאות", "בידור", "קניות", "חשבונות", "אחר"] },
                    },
                    required: ["name", "amount", "category"],
                  },
                },
              },
              required: ["items"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_receipt" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) return new Response(JSON.stringify({ error: "יותר מדי בקשות" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`OpenAI ${res.status}: ${t}`);
    }

    const data = await res.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : null;
    const items = (args?.items ?? []).filter((i: any) => i.name && i.amount > 0);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("receipt-scan error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
