const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const {
      goal,
      daysPerWeek,
      equipment,
      constraints,
      recentPRs,
      exerciseList,
      // New parameters
      age,
      gender,
      fitnessLevel,
      sessionMinutes,
      intensity,
      cardioType,
      cardioDays,
      preferredMuscles,
      avoidedMuscles,
      favoriteExercises,
      blacklistedExercises,
      recentWorkouts,
      // AI Planner v3 params
      planWeeks,
      equipmentItems,
    } = await req.json();

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    // Auto-select split type based on daysPerWeek
    const days = daysPerWeek || 4;
    let splitType = "Upper/Lower";
    if (days <= 3) splitType = "Full Body";
    else if (days >= 5) splitType = "PPL";

    // Build exercise library block for the prompt (compact: name | muscles | equipment)
    const hasLibrary = Array.isArray(exerciseList) && exerciseList.length > 0;
    const libraryBlock = hasLibrary
      ? exerciseList
          .map((e: { name: string; muscles: string; equipment: string }) =>
            `${e.name} | ${e.muscles} | ${e.equipment}`
          )
          .join("\n")
      : null;

    const blacklistNote = Array.isArray(blacklistedExercises) && blacklistedExercises.length > 0
      ? `\nתרגילים אסורים לחלוטין (אל תכלול אותם בשום שבוע): ${blacklistedExercises.join(", ")}`
      : "";

    const favoritesNote = Array.isArray(favoriteExercises) && favoriteExercises.length > 0
      ? `\nתרגילים מועדפים (כלול אותם כאשר קבוצת השריר מתאימה): ${favoriteExercises.join(", ")}`
      : "";

    // preferredNote / avoidedNote removed — these are now emitted as preferredMusclesNote /
    // avoidedMusclesNote below (after targetWeeks), to avoid duplicating them in the prompt.

    const recentWorkoutsNote = Array.isArray(recentWorkouts) && recentWorkouts.length > 0
      ? `\nאימונים אחרונים (להתחשב בהם):\n${recentWorkouts.slice(0, 5).map((w: any) => `- ${w.name || w.category} (${w.date || "לאחרונה"})`).join("\n")}`
      : "";

    const cardioDaysNum = Number(cardioDays) || 0;
    const cardioNote = cardioDaysNum > 0
      ? `\nאירובי: ${cardioDaysNum} מתוך ${days} ימי האימון יוקדשו לאירובי${cardioType ? ` (${cardioType})` : ""}. שלב ימי אירובי ביום שונה מאימוני הכוח. שאר ${days - cardioDaysNum} הימים — אימוני כוח.`
      : "\nאין ימי אירובי — כל הימים אימוני כוח.";

    const ageNote = age && age > 50
      ? "\nחשוב: גיל מעל 50 — הוסף יותר סטי חימום, הפחת עוצמה מקסימלית, תן דגש על התאוששות."
      : "";

    const levelNote = fitnessLevel === "beginner"
      ? "\nרמת מתחיל: מקסימום 3 סטים, תרגילים פשוטים, יותר מנוחה בין סטים."
      : fitnessLevel === "advanced"
      ? "\nרמה מתקדמת: 5 סטים, יותר גיוון, ניתן לכלול סופרסטים."
      : "";

    const systemMessage = `אתה מאמן כושר אישי מומחה המתמחה בתכנון תוכניות מחזוריות (Periodization).
תכנן תוכנית אימונים ל-4 שבועות עם עומס הדרגתי (Progressive Overload) ושבוע Deload חמישי.
${hasLibrary ? "חשוב ביותר: השתמש אך ורק בתרגילים שמופיעים ברשימת הספרייה שסופקה. שם התרגיל שתחזיר חייב להיות זהה בדיוק לשם שמופיע ברשימה (כולל רווחים ואותיות). אל תמציא תרגילים שלא ברשימה." : ""}
עקרונות העומס ההדרגתי:
- שבוע 1: עומס בסיסי
- שבוע 2: +5% בתרגילי בסיס (compound)
- שבוע 3: +5-10% מעומס שבוע 1
- שבוע 4: שבוע שיא — עומס הגבוה ביותר
- שבוע 5 (Deload): 60% מעומס שבוע 1, אותם תרגילים, התמקדות בטכניקה
כל תרגיל חייב לכלול שדה explanation — משפט אחד בעברית המסביר למה בחרת בו.${ageNote}${levelNote}

WORKOUT STRUCTURE RULES (MANDATORY):
1. Each major muscle group session must include EXACTLY 3 exercises with 3 sets × 12 reps as default.
2. Any leg day MUST cover all 4 areas: quadriceps, hamstrings, glutes, AND calves — minimum 1 exercise each.
3. Progressive overload schedule:
   - Week 1: Baseline (3 sets × 12 reps at comfortable weight)
   - Week 2: Increase weight by 5-10% on main lifts
   - Week 3: Add 1 additional set (4 sets × 12 reps)
   - Week 4 (if included): Deload — reduce to 2 sets × 12 reps at 60% of Week 1 weight
4. VARIETY RULE: No exercise name may appear in more than 2 out of 4 weeks. Each week must have at least 50% different exercises from the previous week.
5. Tips array structure: tips[0]=Week 1 advice, tips[1]=Week 2 advice, tips[2]=Week 3 advice, tips[3]=Week 4 advice (if applicable), tips[4+]=general tips.`;

    const targetWeeks = planWeeks ?? 4;

    const equipmentItemsNote = Array.isArray(equipmentItems) && equipmentItems.length > 0
      ? `\nציוד זמין: ${equipmentItems.join(', ')}. השתמש אך ורק בציוד הזה. אסור לכלול תרגיל שדורש ציוד שאינו ברשימה.`
      : "";

    const preferredMusclesNote = Array.isArray(preferredMuscles) && preferredMuscles.length > 0
      ? `\nשרירים מועדפים (יותר עבודה): ${preferredMuscles.join(', ')}`
      : "";

    const avoidedMusclesNote = Array.isArray(avoidedMuscles) && avoidedMuscles.length > 0
      ? `\nשרירים עם עדיפות נמוכה: ${avoidedMuscles.join(', ')}`
      : "";

    const userPrompt = `
מטרה: ${goal || "כוח ומסת שריר"}
ימי אימון בשבוע: ${days}
סוג פיצול מוצע: ${splitType}
ציוד זמין: ${equipment || "חדר כושר מלא"}
מגבלות: ${constraints || "אין"}
גיל: ${age || "לא צוין"}
מגדר: ${gender || "לא צוין"}
רמת כושר: ${fitnessLevel || "intermediate"}
משך אימון: ${sessionMinutes || 60} דקות
עוצמה רצויה (1-5): ${intensity || 3}${cardioNote}
${blacklistNote}${favoritesNote}${recentWorkoutsNote}${equipmentItemsNote}${preferredMusclesNote}${avoidedMusclesNote}
אורך תכנית: ${targetWeeks} שבועות. צור בדיוק ${targetWeeks} שבועות.
שיאים אישיים אחרונים:
${(recentPRs || []).map((p: any) => `- ${p.exercise_name}: ${p.value} ${p.unit}`).join("\n") || "אין נתונים"}
${libraryBlock ? `\nספריית התרגילים הזמינה (שם | שרירים | ציוד) — בחר רק מרשימה זו:\n${libraryBlock}` : ""}

בנה תוכנית אימונים מחזורית ל-${targetWeeks} שבועות. כל אימון: 5-8 תרגילים עם סטים, חזרות, משקל מומלץ (בק"ג), הערות ו-explanation.
החזר תוצאה דרך הפונקציה report_plan.
`;

    const weekSchema = {
      type: "object",
      properties: {
        week_number: { type: "number" },
        overload_note: { type: "string", description: "הוראת עומס לשבוע זה" },
        workouts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "string", description: "יום בשבוע, למשל: יום א'" },
              name: { type: "string", description: "שם האימון, למשל: חזה ותלת ראשי" },
              category: { type: "string", enum: ["weights", "strength", "hypertrophy", "cardio", "running", "core", "mobility", "other"] },
              duration_minutes: { type: "number" },
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "שם מדויק מספריית התרגילים" },
                    sets: { type: "number" },
                    reps: { type: "string", description: "טווח חזרות, למשל: 8-10" },
                    weight_kg: { type: "number" },
                    notes: { type: "string" },
                    explanation: { type: "string", description: "משפט אחד בעברית — למה בחרנו בתרגיל זה" },
                  },
                  required: ["name", "sets", "reps", "explanation"],
                },
              },
            },
            required: ["day", "name", "category", "duration_minutes", "exercises"],
          },
        },
      },
      required: ["week_number", "overload_note", "workouts"],
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_plan",
            description: `Report ${targetWeeks}-week periodized workout plan`,
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "תיאור קצר של התוכנית" },
                split_type: {
                  type: "string",
                  enum: ["PPL", "Upper/Lower", "Full Body"],
                  description: "סוג הפיצול שנבחר",
                },
                weeks: {
                  type: "array",
                  description: `שבועות 1-${targetWeeks} (בדיוק ${targetWeeks} שבועות)`,
                  minItems: targetWeeks,
                  maxItems: targetWeeks,
                  items: weekSchema,
                },
                deload_week: {
                  ...weekSchema,
                  description: "שבוע 5 — Deload",
                },
                tips: { type: "array", items: { type: "string" }, description: "3-5 טיפים לתוכנית" },
              },
              required: ["summary", "split_type", "weeks", "deload_week", "tips"],
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
