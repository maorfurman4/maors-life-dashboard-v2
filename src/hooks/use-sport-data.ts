import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Auth helper ───
async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── Workouts ───
export function useWorkouts(limit = 20) {
  return useQuery({
    queryKey: ["workouts", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*, workout_exercises(*), workout_runs(*)")
        .order("date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useWeekWorkouts() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startDate = startOfWeek.toISOString().slice(0, 10);

  return useQuery({
    queryKey: ["workouts-week", startDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .gte("date", startDate)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workout: {
      category: string;
      duration_minutes?: number;
      calories_burned?: number;
      notes?: string;
      date?: string;
      exercises?: { name: string; sets: number; reps: number; weight_kg?: number }[];
      run?: { distance_km?: number; duration_minutes?: number; pace_per_km?: number };
    }) => {
      const userId = await getUserId();
      const { data: workoutRow, error: wErr } = await supabase
        .from("workouts")
        .insert({
          user_id: userId,
          category: workout.category,
          duration_minutes: workout.duration_minutes || null,
          calories_burned: workout.calories_burned || null,
          notes: workout.notes || null,
          date: workout.date || new Date().toISOString().slice(0, 10),
        })
        .select("id")
        .single();
      if (wErr) throw wErr;

      // Insert exercises
      if (workout.exercises?.length) {
        const exerciseRows = workout.exercises.map((ex) => ({
          workout_id: workoutRow.id,
          user_id: userId,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight_kg: ex.weight_kg || null,
        }));
        const { error: exErr } = await supabase.from("workout_exercises").insert(exerciseRows);
        if (exErr) throw exErr;
      }

      // Insert run data
      if (workout.run) {
        const { error: runErr } = await supabase.from("workout_runs").insert({
          workout_id: workoutRow.id,
          user_id: userId,
          distance_km: workout.run.distance_km || null,
          duration_minutes: workout.run.duration_minutes || null,
          pace_per_km: workout.run.pace_per_km || null,
        });
        if (runErr) throw runErr;
      }

      return workoutRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["workouts-week"] });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["workouts-week"] });
    },
  });
}

// ─── Workout Templates ───
export function useWorkoutTemplates() {
  return useQuery({
    queryKey: ["workout-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddWorkoutTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: {
      name: string;
      category: string;
      exercises: { name: string; sets: number; reps: number; weight_kg?: number }[];
      estimated_duration_minutes?: number;
      estimated_calories?: number;
      notes?: string;
    }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("workout_templates").insert({
        user_id: userId,
        name: template.name,
        category: template.category,
        exercises: template.exercises as any,
        estimated_duration_minutes: template.estimated_duration_minutes || null,
        estimated_calories: template.estimated_calories || null,
        notes: template.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workout-templates"] }),
  });
}

export function useDeleteWorkoutTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workout_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workout-templates"] }),
  });
}

// ─── Weight Entries ───
export function useWeightEntries(limit = 30) {
  return useQuery({
    queryKey: ["weight-entries", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weight_entries")
        .select("*")
        .order("date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { weight_kg: number; date?: string; notes?: string }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("weight_entries").insert({
        user_id: userId,
        weight_kg: entry.weight_kg,
        date: entry.date || new Date().toISOString().slice(0, 10),
        notes: entry.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weight-entries"] }),
  });
}

export function useDeleteWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weight_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weight-entries"] }),
  });
}

// ─── Nutrition Entries ───
export function useNutritionEntries(date?: string) {
  const targetDate = date || new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["nutrition-entries", targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nutrition_entries")
        .select("*")
        .eq("date", targetDate)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddNutrition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      name: string;
      meal_type: string;
      calories?: number;
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
      notes?: string;
      date?: string;
    }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("nutrition_entries").insert({
        user_id: userId,
        name: entry.name,
        meal_type: entry.meal_type,
        calories: entry.calories || null,
        protein_g: entry.protein_g || null,
        carbs_g: entry.carbs_g || null,
        fat_g: entry.fat_g || null,
        notes: entry.notes || null,
        date: entry.date || new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nutrition-entries"] }),
  });
}

export function useDeleteNutrition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nutrition_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nutrition-entries"] }),
  });
}

// ─── Water Entries ───
export function useWaterEntry(date?: string) {
  const targetDate = date || new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["water-entry", targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_entries")
        .select("*")
        .eq("date", targetDate)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertWater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ glasses, date }: { glasses: number; date?: string }) => {
      const userId = await getUserId();
      const targetDate = date || new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabase
        .from("water_entries")
        .select("id")
        .eq("user_id", userId)
        .eq("date", targetDate)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("water_entries").update({ glasses }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("water_entries").insert({
          user_id: userId,
          glasses,
          date: targetDate,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water-entry"] }),
  });
}

// ─── Stock Holdings ───
export function useStockHoldings() {
  return useQuery({
    queryKey: ["stock-holdings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_holdings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddStockHolding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (holding: {
      symbol: string;
      name?: string;
      shares: number;
      avg_price: number;
      currency?: string;
    }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("stock_holdings").insert({
        user_id: userId,
        symbol: holding.symbol.toUpperCase(),
        name: holding.name || null,
        shares: holding.shares,
        avg_price: holding.avg_price,
        currency: holding.currency || "USD",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-holdings"] }),
  });
}

export function useDeleteStockHolding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stock_holdings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-holdings"] }),
  });
}

// ─── Personal Records ───
export function usePersonalRecords() {
  return useQuery({
    queryKey: ["personal-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_records")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddPersonalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pr: {
      exercise_name: string;
      value: number;
      unit?: string;
      category?: string;
      date?: string;
      notes?: string;
    }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("personal_records").insert({
        user_id: userId,
        exercise_name: pr.exercise_name,
        value: pr.value,
        unit: pr.unit || "reps",
        category: pr.category || "calisthenics",
        date: pr.date || new Date().toISOString().slice(0, 10),
        notes: pr.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personal-records"] }),
  });
}

// ─── Favorite Meals ───
export function useFavoriteMeals() {
  return useQuery({
    queryKey: ["favorite-meals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorite_meals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddFavoriteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (meal: {
      name: string;
      calories?: number;
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
    }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("favorite_meals").insert({
        user_id: userId,
        name: meal.name,
        calories: meal.calories || null,
        protein_g: meal.protein_g || null,
        carbs_g: meal.carbs_g || null,
        fat_g: meal.fat_g || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorite-meals"] }),
  });
}

export function useDeleteFavoriteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("favorite_meals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorite-meals"] }),
  });
}

// ─── User Settings ───
export function useUserSettings() {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// Alias for generic settings updates (used by settings components)
export function useUpdateUserSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Record<string, unknown>) => {
      const userId = await getUserId();
      const { data: existing } = await (supabase as any)
        .from("user_settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from("user_settings")
          .update(settings)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("user_settings")
          .insert({ user_id: userId, ...settings });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-settings"] });
    },
    onError: (e: Error) => {
      toast.error("שגיאה בשמירת ההגדרות: " + e.message);
    },
  });
}

export function useSaveUserSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<{
      full_name: string | null;
      date_of_birth: string | null;
      height_cm: number | null;
      weight_kg: number | null;
      daily_calories_goal: number | null;
      daily_protein_goal: number | null;
      daily_carbs_goal: number | null;
      daily_fat_goal: number | null;
      daily_water_glasses_goal: number | null;
      weekly_workouts_goal: number | null;
      weekly_minutes_goal: number | null;
      weekly_calories_burn_goal: number | null;
      shoulder_sensitivity: boolean | null;
      training_day_calories: number | null;
      training_day_protein: number | null;
      daily_water_ml: number | null;
      savings_goal_pct: number | null;
      income_sync_mode: string | null;
    }>) => {
      const userId = await getUserId();
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_settings")
          .update(settings)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_settings")
          .insert({ user_id: userId, ...settings });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-settings"] });
      qc.invalidateQueries({ queryKey: ["payroll-settings"] });
      qc.invalidateQueries({ queryKey: ["finance-settings"] });
    },
  });
}
