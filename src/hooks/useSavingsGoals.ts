import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  emoji: string | null;
  created_at: string;
}

export function useSavingsGoals() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const query = useQuery<SavingsGoal[]>({
    queryKey: ["savings_goals", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from("savings_goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavingsGoal[];
    },
  });

  const addGoalMutation = useMutation({
    mutationFn: async ({
      title,
      targetAmount,
      deadline,
      emoji,
    }: {
      title: string;
      targetAmount: number;
      deadline?: string;
      emoji?: string;
    }) => {
      const { error } = await db.from("savings_goals").insert({
        user_id: userId,
        title,
        target_amount: targetAmount,
        current_amount: 0,
        deadline: deadline ?? null,
        emoji: emoji ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings_goals", userId] }),
  });

  const depositMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const goal = query.data?.find((g) => g.id === id);
      if (!goal) throw new Error("יעד לא נמצא");
      const newAmount = goal.current_amount + amount;
      const { error } = await db
        .from("savings_goals")
        .update({ current_amount: newAmount })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings_goals", userId] }),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("savings_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings_goals", userId] }),
  });

  return {
    goals: query.data ?? [],
    isLoading: query.isLoading,
    addGoal: (title: string, targetAmount: number, deadline?: string, emoji?: string) =>
      addGoalMutation.mutateAsync({ title, targetAmount, deadline, emoji }),
    deposit: (id: string, amount: number) => depositMutation.mutateAsync({ id, amount }),
    deleteGoal: (id: string) => deleteGoalMutation.mutateAsync(id),
    isAdding: addGoalMutation.isPending,
    isDepositing: depositMutation.isPending,
  };
}
