const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { imageBase64, mimeType, muscleGroup } = await req.json();

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Model: gpt-4o — used for vision analysis (image_url content)
        model: "gpt-4o",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                  detail: "low",
                },
              },
              {
                type: "text",
                text: `You are a personal trainer. Identify this gym machine.
Target muscle group: ${muscleGroup}

Respond ONLY with valid JSON (no markdown):
{
  "machineName": "שם המכונה בעברית",
  "howToUse": "2-3 משפטים בעברית על איך להשתמש במכונה לשריר ${muscleGroup}",
  "equipmentKeywords": ["מילת ציוד1", "מילת ציוד2"]
}

equipmentKeywords should match Hebrew equipment terms used in Israeli gyms (e.g. "כבל", "מכבש", "ספסל").`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("OpenAI error:", response.status, t);
      throw new Error(`AI ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    const clean = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("identify-machine error:", err);
    return new Response(
      JSON.stringify({
        error: (err as Error).message,
        machineName: "לא זוהה",
        howToUse: "לא ניתן לזהות את המכונה. נסה תמונה ברורה יותר.",
        equipmentKeywords: [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
