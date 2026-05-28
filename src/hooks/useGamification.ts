import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { xpToLevel, levelProgress, type AchievementKey } from "@/lib/gamification";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserXpRow {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  updated_at: string;
}

interface AchievementRow {
  id: string;
  user_id: string;
  achievement_key: string;
  achieved_at: string;
  xp_earned: number;
}

interface StreakRow {
  id: string;
  user_id: string;
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGamification() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  // XP row
  const xpQuery = useQuery({
    queryKey: ["user-xp", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_xp")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as UserXpRow | null);
    },
  });

  // Achievements
  const achievementsQuery = useQuery({
    queryKey: ["user-achievements", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("achievements")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return ((data as AchievementRow[]) || []).map((a) => a.achievement_key);
    },
  });

  // Streaks
  const streaksQuery = useQuery({
    queryKey: ["user-streaks", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      const result: Record<string, number> = {};
      for (const row of ((data as StreakRow[]) || [])) {
        result[row.streak_type] = row.current_streak;
      }
      return result;
    },
  });

  // Computed values
  const totalXp = xpQuery.data?.total_xp ?? 0;
  const level = xpToLevel(totalXp);
  const progress = levelProgress(totalXp);
  const achievements = achievementsQuery.data ?? [];
  const streaks = streaksQuery.data ?? {};

  // Add XP mutation
  const addXpMutation = useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      if (!userId) throw new Error("Not authenticated");
      const newXp = totalXp + amount;
      const newLevel = xpToLevel(newXp);

      const { error } = await (supabase as any)
        .from("user_xp")
        .upsert(
          { user_id: userId, total_xp: newXp, level: newLevel, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      console.log(`[Gamification] +${amount} XP — ${reason}`);
      return { newXp, newLevel, prevLevel: level };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-xp", userId] });
    },
  });

  // Unlock achievement mutation
  const unlockAchievementMutation = useMutation({
    mutationFn: async (key: AchievementKey) => {
      if (!userId) throw new Error("Not authenticated");
      if (achievements.includes(key)) return; // already unlocked

      const { ACHIEVEMENTS } = await import("@/lib/gamification");
      const achievement = ACHIEVEMENTS[key];

      const { error } = await (supabase as any)
        .from("achievements")
        .insert({
          user_id: userId,
          achievement_key: key,
          achieved_at: new Date().toISOString(),
          xp_earned: achievement.xp,
        });
      // Ignore unique constraint violations (already exists)
      if (error && !error.message?.includes("unique")) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-achievements", userId] });
    },
  });

  const addXP = async (amount: number, reason: string) => {
    await addXpMutation.mutateAsync({ amount, reason });
  };

  const unlockAchievement = async (key: AchievementKey) => {
    await unlockAchievementMutation.mutateAsync(key);
  };

  return {
    xp: totalXp,
    level,
    progress,
    achievements,
    streaks,
    addXP,
    unlockAchievement,
    isLoading: xpQuery.isLoading || achievementsQuery.isLoading || streaksQuery.isLoading,
  };
}
