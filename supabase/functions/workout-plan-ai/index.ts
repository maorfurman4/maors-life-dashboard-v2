import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { goal, daysPerWeek, equipment, constraints, recentPRs } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

    const userPrompt = `
מטרה: ${goal || "כוח ומסת שריר"}
ימי אימון בשבוע: ${daysPerWeek || 4}
ציוד זמין: ${equipment || "חדר כושר מלא"}
מגבלות: ${constraints || "אין"}
שיאים אישיים אחרונים:
${(recentPRs || []).map((p: any) => `- ${p.exercise_name}: ${p.value} ${p.unit}`).join("\n") || "אין נתונים"}

בנה תוכנית אימונים שבועית מותאמת אישית. כל אימון צריך 5-8 תרגילים עם סטים, חזרות ומשקל מומלץ (בק"ג).
החזר תוצאה כ-JSON דרך הפונקציה.
`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "אתה מאמן כושר אישי מומחה. תכנן תוכניות אימונים בטוחות ויעילות בעברית." },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_plan",
            description: "Report weekly workout plan",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "תיאור קצר של התוכנית" },
                workouts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string", description: "יום בשבוע, למשל: ראשון" },
                      name: { type: "string", description: "שם האימון, למשל: חזה וטריצפס" },
                      category: { type: "string", enum: ["strength", "hypertrophy", "cardio", "running", "core", "mobility", "other"] },
                      duration_minutes: { type: "number" },
                      exercises: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            sets: { type: "number" },
                            reps: { type: "string", description: "טווח חזרות, למשל: 8-12" },
                            weight_kg: { type: "number" },
                            notes: { type: "string" },
                          },
                          required: ["name", "sets", "reps"],
                        },
                      },
                    },
                    required: ["day", "name", "category", "duration_minutes", "exercises"],
                  },
                },
                tips: { type: "array", items: { type: "string" }, description: "3-5 טיפים לתוכנית" },
              },
              required: ["summary", "workouts", "tips"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_plan" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("AI error:", res.status, t);
      if (res.status === 429) return new Response(JSON.stringify({ error: "יותר מדי בקשות" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "אין קרדיטים" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI ${res.status}`);
    }

    const data = await res.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!args) return new Response(JSON.stringify({ error: "AI לא החזיר תוכנית" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ plan: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("workout-plan-ai error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
