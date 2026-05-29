import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-make-secret",
};

/**
 * omni-daily-brief — Secure daily data aggregator for Make.com
 *
 * Auth: x-make-secret header (set MAKE_COM_SECRET in Supabase Edge Function env)
 * Body: { "userId": "<supabase-user-uuid>" }
 *
 * Returns unified JSON with: shifts, workouts, TDEE settings, yesterday's budget
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ── Auth: validate Make.com shared secret ────────────────────────────────────
  const makeSecret = req.headers.get('x-make-secret');
  const expectedSecret = Deno.env.get('MAKE_COM_SECRET');
  if (!expectedSecret || makeSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const userId: string = body.userId;
    if (!userId) throw new Error('userId is required in request body');

    // ── Supabase admin client (server-only, bypasses RLS safely) ────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ── Compute today / yesterday in Asia/Jerusalem ─────────────────────────────
    const nowJerusalem = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
    const today = nowJerusalem.toISOString().slice(0, 10);
    const yesterdayDate = new Date(nowJerusalem);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    // ── Fetch all 4 modules in parallel ─────────────────────────────────────────
    const [shiftsRes, workoutsRes, settingsRes, expensesRes, incomeRes, nutritionRes] =
      await Promise.allSettled([
        // Work: today's shifts
        supabase.from('work_shifts')
          .select('type, date, is_shabbat_holiday')
          .eq('user_id', userId)
          .eq('date', today),

        // Sport: today's workouts (upcoming)
        supabase.from('workouts')
          .select('name, category, date, duration_minutes, calories_burned')
          .eq('user_id', userId)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(3),

        // Settings: TDEE target + monthly budget
        supabase.from('user_settings')
          .select('daily_calorie_goal, protein_goal, monthly_budget, water_goal_ml')
          .eq('user_id', userId)
          .maybeSingle(),

        // Finance: yesterday's expenses
        supabase.from('expense_entries')
          .select('amount, category')
          .eq('user_id', userId)
          .eq('date', yesterday),

        // Finance: yesterday's income
        supabase.from('income_entries')
          .select('amount')
          .eq('user_id', userId)
          .eq('date', yesterday),

        // Nutrition: today logged so far
        supabase.from('nutrition_entries')
          .select('calories, protein_g, carbs_g, fat_g')
          .eq('user_id', userId)
          .eq('date', today),
      ]);

    // ── Process ──────────────────────────────────────────────────────────────────
    const todayShifts   = shiftsRes.status   === 'fulfilled' ? (shiftsRes.value.data   ?? []) : [];
    const todayWorkouts = workoutsRes.status === 'fulfilled' ? (workoutsRes.value.data ?? []) : [];
    const settings      = settingsRes.status === 'fulfilled' ? settingsRes.value.data          : null;
    const expenses      = expensesRes.status === 'fulfilled' ? (expensesRes.value.data ?? []) : [];
    const incomes       = incomeRes.status   === 'fulfilled' ? (incomeRes.value.data   ?? []) : [];
    const nutrition     = nutritionRes.status === 'fulfilled' ? (nutritionRes.value.data ?? []) : [];

    const totalExpenses      = expenses.reduce((s: number, e: any) => s + Number(e.amount  ?? 0), 0);
    const totalIncome        = incomes.reduce((s: number, i: any)  => s + Number(i.amount  ?? 0), 0);
    const totalCalories      = nutrition.reduce((s: number, n: any) => s + Number(n.calories  ?? 0), 0);
    const totalProtein       = nutrition.reduce((s: number, n: any) => s + Number(n.protein_g ?? 0), 0);

    const topExpenseCategories = Object.entries(
      expenses.reduce((acc: Record<string, number>, e: any) => {
        const cat = e.category ?? 'אחר';
        acc[cat] = (acc[cat] ?? 0) + Number(e.amount ?? 0);
        return acc;
      }, {})
    ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3);

    return new Response(JSON.stringify({
      date: today,
      // Work module
      todayShifts,
      // Sport module
      todayWorkouts,
      // Settings
      settings,
      // Finance module
      yesterdayBudget: {
        date: yesterday,
        expenses: Math.round(totalExpenses),
        income:   Math.round(totalIncome),
        balance:  Math.round(totalIncome - totalExpenses),
        topCategories: topExpenseCategories,
      },
      // Nutrition module
      todayNutrition: {
        caloriesConsumed:  Math.round(totalCalories),
        proteinConsumed:   Math.round(totalProtein),
        caloriesTarget:    settings?.daily_calorie_goal ?? 2000,
        caloriesRemaining: Math.round((settings?.daily_calorie_goal ?? 2000) - totalCalories),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
