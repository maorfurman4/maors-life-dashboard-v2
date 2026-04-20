import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── Watchlist ───────────────────────────────────────────────────────────────

export interface WatchlistItem {
  id: string;
  symbol: string;
  created_at: string;
}

export function useWatchlist() {
  return useQuery<WatchlistItem[]>({
    queryKey: ["market-watchlist"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await db
        .from("market_watchlist")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as WatchlistItem[];
    },
  });
}

export function useAddWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      const userId = await getUserId();
      const { error } = await db
        .from("market_watchlist")
        .insert({ user_id: userId, symbol: symbol.toUpperCase().trim() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["market-watchlist"] }),
  });
}

export function useDeleteWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("market_watchlist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["market-watchlist"] }),
  });
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export interface MarketAlert {
  id: string;
  symbol: string;
  target_price: number;
  direction: "above" | "below";
  is_triggered: boolean;
  created_at: string;
}

export function useMarketAlerts() {
  return useQuery<MarketAlert[]>({
    queryKey: ["market-alerts"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await db
        .from("market_alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MarketAlert[];
    },
  });
}

export function useAddMarketAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alert: { symbol: string; target_price: number; direction: "above" | "below" }) => {
      const userId = await getUserId();
      const { error } = await db
        .from("market_alerts")
        .insert({ user_id: userId, ...alert, symbol: alert.symbol.toUpperCase() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["market-alerts"] }),
  });
}

export function useDeleteMarketAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("market_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["market-alerts"] }),
  });
}

export function useTriggerAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("market_alerts")
        .update({ is_triggered: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["market-alerts"] }),
  });
}
