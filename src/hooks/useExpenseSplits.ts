import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface SplitParticipant {
  name: string;
  amount: number;
  paid: boolean;
}

export interface ExpenseSplit {
  id: string;
  user_id: string;
  total_amount: number;
  description: string;
  currency: string;
  participants: SplitParticipant[];
  created_at: string;
}

export function useExpenseSplits() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const query = useQuery<ExpenseSplit[]>({
    queryKey: ["expense_splits", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from("expense_splits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExpenseSplit[];
    },
  });

  const createSplitMutation = useMutation({
    mutationFn: async ({
      description,
      totalAmount,
      participants,
    }: {
      description: string;
      totalAmount: number;
      participants: SplitParticipant[];
    }) => {
      const { error } = await db.from("expense_splits").insert({
        user_id: userId,
        description,
        total_amount: totalAmount,
        currency: "ILS",
        participants,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense_splits", userId] }),
  });

  return {
    splits: query.data ?? [],
    isLoading: query.isLoading,
    createSplit: (
      description: string,
      totalAmount: number,
      participants: SplitParticipant[]
    ) => createSplitMutation.mutateAsync({ description, totalAmount, participants }),
    isCreating: createSplitMutation.isPending,
  };
}
