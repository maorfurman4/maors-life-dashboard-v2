import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { fileUrl } = await req.json();
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("No API key");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: fileUrl } },
            {
              type: "text",
              text: `זהו תלוש שכר ישראלי. חלץ את המידע הבא והחזר JSON בלבד ללא הסברים:
{
  "hourlyRate": <שכר שעתי בסיסי כמספר>,
  "grossPay": <שכר ברוטו כמספר>,
  "netPay": <שכר נטו כמספר>,
  "nationalInsurance": <ביטוח לאומי כמספר>,
  "healthInsurance": <ביטוח בריאות כמספר>,
  "pension": <פנסיה כמספר>,
  "educationFund": <קרן השתלמות כמספר>,
  "avgGross": <ברוטו ממוצע (אם מצוין) כמספר, אחרת זהה לגרוס>
}`
            }
          ]
        }],
        max_tokens: 500,
      }),
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content ?? "{}";

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let extracted: Record<string, unknown> = {};
    if (jsonMatch) {
      try {
        extracted = JSON.parse(jsonMatch[0]);
      } catch {
        // Model returned malformed JSON — return empty object so the caller
        // can handle the missing data gracefully instead of getting a 500.
        console.error("Failed to parse model JSON:", jsonMatch[0]);
      }
    }

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
