const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { calorieGoal, restrictions, budget, userId } = await req.json();

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const restrictionsText = Array.isArray(restrictions) && restrictions.length > 0
      ? `הגבלות תזונה: ${restrictions.join(", ")}.`
      : "אין הגבלות תזונה מיוחדות.";

    const budgetText = budget
      ? `תקציב מזון יומי: ${budget} ₪.`
      : "";

    const systemMessage = `אתה תזונאי מוסמך המתמחה בתכנון תפריטים שבועיים מאוזנים בהתאמה אישית.
תכנן תפריט שבועי מלא ל-7 ימים עם 3 ארוחות ביום.
השתמש במאכלים ישראליים ומקומיים שניתן לקנות בסופרמרקט רגיל.
כל ארוחה חייבת לכלול: שם, קלוריות ורשימת מרכיבים.
החזר תמיד JSON תקני בלבד, ללא הסברים נוספים.`;

    const userPrompt = `צור תפריט שבועי אישי לפי הפרטים הבאים:
יעד קלורי יומי: ${calorieGoal || 2000} קלוריות.
${restrictionsText}
${budgetText}
משתמש: ${userId || "אנונימי"}

החזר JSON בפורמט הבא בדיוק:
{
  "plan": [
    {
      "day": "ראשון",
      "meals": [
        {
          "type": "ארוחת בוקר",
          "name": "שם הארוחה",
          "calories": 400,
          "ingredients": ["מרכיב 1", "מרכיב 2"]
        },
        {
          "type": "ארוחת צהריים",
          "name": "שם הארוחה",
          "calories": 700,
          "ingredients": ["מרכיב 1", "מרכיב 2"]
        },
        {
          "type": "ארוחת ערב",
          "name": "שם הארוחה",
          "calories": 600,
          "ingredients": ["מרכיב 1", "מרכיב 2"]
        }
      ]
    }
  ],
  "shoppingList": ["פריט קנייה 1", "פריט קנייה 2"]
}

ימים: ראשון, שני, שלישי, רביעי, חמישי, שישי, שבת (7 ימים בדיוק).
רשימת הקנייה תכלול את כל המרכיבים הייחודיים לכל השבוע.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("OpenAI error:", res.status, t);
      if (res.status === 429) {
        return new Response(
          JSON.stringify({ error: "יותר מדי בקשות — נסה שוב בעוד מספר שניות" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`OpenAI ${res.status}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI לא החזיר תוכן");

    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("meal-plan-ai error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
