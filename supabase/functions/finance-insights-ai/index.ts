import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Verify the request has a valid Supabase JWT
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
    const { currentMonth, previousMonths, savingsGoalPct } = await req.json();
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const userPrompt = `
חודש נוכחי:
- הכנסות: ₪${currentMonth?.income || 0}
- הוצאות: ₪${currentMonth?.expenses || 0}
- חיסכון בפועל: ₪${currentMonth?.savings || 0} (יעד: ${savingsGoalPct || 35}%)
- פירוט קטגוריות: ${JSON.stringify(currentMonth?.categories || {})}

חודשים קודמים (ממוצע):
${(previousMonths || []).map((m: any) => `- ${m.label}: הכנסות ₪${m.income}, הוצאות ₪${m.expenses}, חיסכון ₪${m.savings}`).join("\n") || "אין נתונים"}

נתח את המצב, השווה לחודשים קודמים, וזהה איפה בזבז יותר מדי. תן 3-5 המלצות מעשיות וקצרות בעברית איפה לקצץ ואיך להגיע ליעד החיסכון.
`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // Model: gpt-4o — used for complex financial analysis and multi-month comparisons
        model: "gpt-4o",
        messages: [
          { role: "system", content: "אתה יועץ פיננסי אישי בישראל. דבר בעברית, תן עצות מעשיות וקצרות." },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_insights",
            description: "Report financial insights",
            parameters: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["excellent", "good", "warning", "danger"] },
                summary: { type: "string", description: "סיכום קצר במשפט אחד" },
                comparisons: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      change_pct: { type: "number", description: "שינוי באחוזים מול חודש קודם, חיובי=עליה" },
                      verdict: { type: "string", enum: ["good", "neutral", "bad"] },
                      note: { type: "string" },
                    },
                    required: ["category", "change_pct", "verdict", "note"],
                  },
                },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      impact_ils: { type: "number", description: "חיסכון פוטנציאלי בש\"ח" },
                      action: { type: "string", description: "פעולה מומלצת" },
                    },
                    required: ["title", "impact_ils", "action"],
                  },
                },
              },
              required: ["status", "summary", "comparisons", "recommendations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_insights" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("AI error:", res.status, t);
      if (res.status === 429) return new Response(JSON.stringify({ error: "יותר מדי בקשות" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI ${res.status}`);
    }

    const data = await res.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    let args = null;
    if (toolCall) {
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Failed to parse OpenAI tool call arguments:', toolCall.function.arguments);
        return new Response(JSON.stringify({ error: 'AI response was not valid JSON' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!args) return new Response(JSON.stringify({ error: "AI לא החזיר ניתוח" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ insights: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("finance-insights-ai error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
