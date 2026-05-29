import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // JWT authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { fileUrl } = await req.json();

    // SSRF protection: only allow Supabase storage URLs
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const allowedStoragePrefix = `${supabaseUrl}/storage/v1/object/`;
    if (!fileUrl || !fileUrl.startsWith(allowedStoragePrefix)) {
      return new Response(JSON.stringify({ error: 'Invalid file URL: only Supabase storage URLs are allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("No API key");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // Model: gpt-4o — used for vision analysis (payslip document parsing)
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
