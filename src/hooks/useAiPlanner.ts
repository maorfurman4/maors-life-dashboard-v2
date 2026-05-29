import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorkoutPlanRow {
  id: string;
  name: string;
  goal: string | null;
  level: string | null;
  split_type: string | null;
  weeks: any[];
  deload_week: any | null;
  tips: string[] | null;
  created_at: string;
}

export interface UserFitnessProfile {
  age: number | null;
  gender: "male" | "female" | "other" | null;
  fitness_level: "beginner" | "intermediate" | "advanced";
  preferred_muscles: string[];
  avoided_muscles: string[];
  favorite_exercises: string[];
  blacklisted_exercises: string[];
}

// ── Supabase client cast to any (new tables not yet in generated types) ────────
const db = supabase as any;

// ── Workout Plans ─────────────────────────────────────────────────────────────

export function useWorkoutPlans() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: ["workout-plans", userId],
    queryFn: async () => {
      const { data, error } = await db
        .from("workout_plans")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WorkoutPlanRow[];
    },
  });
}

export function useSaveWorkoutPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: {
      name: string;
      goal?: string;
      level?: string;
      split_type?: string;
      weeks: any[];
      deload_week?: any;
      tips?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await db
        .from("workout_plans")
        .insert({ ...plan, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as WorkoutPlanRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-plans"] });
    },
  });
}

export function useDeleteWorkoutPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("workout_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workout-plans"] }),
  });
}

// ── User Fitness Profile ──────────────────────────────────────────────────────

export function useUserFitnessProfile() {
  return useQuery({
    queryKey: ["user-fitness-profile"],
    queryFn: async () => {
      const { data, error } = await db
        .from("user_fitness_profile")
        .select("*")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return (data as UserFitnessProfile) ?? null;
    },
  });
}

export function useUpdateFitnessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Partial<UserFitnessProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await db
        .from("user_fitness_profile")
        .upsert({ ...profile, user_id: user.id, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-fitness-profile"] }),
  });
}
