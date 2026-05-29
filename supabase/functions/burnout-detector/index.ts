import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-make-secret",
};

/** Hours per shift type — mirrors payroll-engine.ts */
const SHIFT_HOURS: Record<string, number> = {
  regular: 8, evening: 8, morning: 8, night: 8, long_night: 12,
  friday: 8, shabbat: 8, holiday: 8, extra: 4, manual_hourly: 1,
  vacation_day: 0, sick_day: 0, vacation: 0, sick: 0,
};

/**
 * burnout-detector — Autonomous recovery engine
 *
 * Auth: x-make-secret header (set MAKE_COM_SECRET in Supabase env)
 * Input: { "userId": "<uuid>" }
 *
 * Logic: IF workHours > 40 AND workoutCount >= 4 in last 7 days
 *   → auto-adjust user_settings.daily_calorie_goal += 200
 *   → award +25 XP "beast mode" bonus
 *
 * Output: { burnout, workHours, workoutCount, action?, caloriesAdded?, newGoal? }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const makeSecret = req.headers.get('x-make-secret');
  const expectedSecret = Deno.env.get('MAKE_COM_SECRET');
  if (!expectedSecret || makeSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { userId } = await req.json();
    if (!userId) throw new Error('userId is required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ── Last 7 days window ────────────────────────────────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString().slice(0, 10);

    // ── Fetch shifts + workouts in parallel ───────────────────────────────────
    const [shiftsRes, workoutsRes] = await Promise.allSettled([
      supabase.from('work_shifts')
        .select('type, date')
        .eq('user_id', userId)
        .gte('date', fromDate),
      supabase.from('workouts')
        .select('id')
        .eq('user_id', userId)
        .gte('date', fromDate),
    ]);

    const shifts    = shiftsRes.status   === 'fulfilled' ? (shiftsRes.value.data   ?? []) : [];
    const workouts  = workoutsRes.status === 'fulfilled' ? (workoutsRes.value.data ?? []) : [];

    const workHours    = shifts.reduce((t: number, s: any) => t + (SHIFT_HOURS[s.type] ?? 8), 0);
    const workoutCount = workouts.length;

    // ── Evaluate burnout threshold ────────────────────────────────────────────
    const isBurnout = workHours > 40 && workoutCount >= 4;

    if (!isBurnout) {
      return new Response(JSON.stringify({
        burnout: false,
        workHours,
        workoutCount,
        message: `No burnout detected. ${workHours}h work, ${workoutCount} workouts this week.`,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Burnout: auto-adjust TDEE +200 ────────────────────────────────────────
    const { data: settings } = await supabase
      .from('user_settings')
      .select('daily_calorie_goal')
      .eq('user_id', userId)
      .maybeSingle();

    const currentGoal = settings?.daily_calorie_goal ?? 2000;
    const newGoal     = currentGoal + 200;

    await supabase.from('user_settings').upsert({
      user_id: userId,
      daily_calorie_goal: newGoal,
    }, { onConflict: 'user_id' });

    // Award +25 XP for beast mode
    await supabase.rpc('increment_user_xp', { p_user_id: userId, p_xp: 25 }).catch(() => null);

    return new Response(JSON.stringify({
      burnout: true,
      workHours,
      workoutCount,
      action:       'calories_adjusted',
      caloriesAdded: 200,
      previousGoal: currentGoal,
      newGoal,
      xpAwarded:    25,
      message: `Beast mode detected! Auto-adjusted calories ${currentGoal} → ${newGoal} kcal. +25 XP awarded.`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
