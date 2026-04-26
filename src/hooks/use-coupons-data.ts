import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useCoupons() {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: {
      title: string;
      code?: string | null;
      store?: string | null;
      discount_amount?: number | null;
      discount_percent?: number | null;
      expiry_date?: string | null;
      category?: string | null;
      notes?: string | null;
    }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("coupons").insert({
        user_id: userId,
        title: c.title,
        code: c.code ?? null,
        store: c.store ?? null,
        discount_amount: c.discount_amount ?? null,
        discount_percent: c.discount_percent ?? null,
        expiry_date: c.expiry_date ?? null,
        category: c.category ?? null,
        notes: c.notes ?? null,
        is_used: false,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; is_used?: boolean; title?: string; code?: string | null; store?: string | null; expiry_date?: string | null }) => {
      const { error } = await supabase.from("coupons").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}
