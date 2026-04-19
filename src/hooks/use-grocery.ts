import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useGroceryLists() {
  return useQuery({
    queryKey: ["grocery_lists"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("grocery_lists")
        .select("*, grocery_items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddGroceryList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const userId = await getUserId();
      const { error } = await supabase
        .from("grocery_lists")
        .insert({ name, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery_lists"] }),
  });
}

export function useAddGroceryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { list_id: string; name: string; quantity?: number; unit?: string; barcode?: string }) => {
      const userId = await getUserId();
      const { error } = await supabase
        .from("grocery_items")
        .insert({ ...item, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery_lists"] }),
  });
}

export function useToggleGroceryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_checked }: { id: string; is_checked: boolean }) => {
      const { error } = await supabase
        .from("grocery_items")
        .update({ is_checked })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery_lists"] }),
  });
}
