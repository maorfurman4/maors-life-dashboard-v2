import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useCoupons() {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: {
      title: string;
      code?: string;
      barcode?: string;
      store?: string;
      discount_amount?: number;
      discount_percent?: number;
      expiry_date?: string;
      category?: string;
      notes?: string;
    }) => {
      const userId = await getUserId();
      const { error } = await supabase
        .from("coupons")
        .insert({ ...coupon, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("קופון נוסף בהצלחה");
    },
    onError: () => toast.error("שגיאה בהוספת קופון"),
  });
}

export function useMarkCouponUsed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("coupons")
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useMonthlyCouponSavings() {
  return useQuery({
    queryKey: ["coupons-monthly-savings"],
    queryFn: async () => {
      const userId  = await getUserId();
      const now     = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data, error } = await supabase
        .from("coupons")
        .select("discount_amount, discount_percent")
        .eq("user_id", userId)
        .eq("is_used", true)
        .gte("used_at", monthStart);

      if (error) throw error;
      const total = (data || []).reduce(
        (sum, c) => sum + (c.discount_amount ?? 0),
        0
      );
      return { total, count: (data || []).length };
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("קופון נמחק");
    },
  });
}
