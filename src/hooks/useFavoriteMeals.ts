import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { todayLocalStr } from "@/utils/date";

type FavoriteMeal = {
  id: string;
  user_id: string;
  name: string;
  calories: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  created_at: string;
};

function autoMealTypeHebrew(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return "ארוחת בוקר";
  if (h >= 10 && h < 15) return "ארוחת צהריים";
  if (h >= 15 && h < 18) return "חטיף";
  return "ארוחת ערב";
}

export function useFavoriteMeals() {
  const { user } = useAuth();
  const userId = user?.id;
  const qc = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ["favorite_meals", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorite_meals")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as FavoriteMeal[]) ?? [];
    },
  });

  const addFavoriteMutation = useMutation({
    mutationFn: async (meal: {
      name: string;
      calories?: number;
      protein?: number;
      fat?: number;
      carbs?: number;
    }) => {
      if (!userId) throw new Error("לא מחובר");
      const { error } = await supabase.from("favorite_meals").insert({
        user_id: userId,
        name: meal.name,
        calories: meal.calories ?? null,
        protein_g: meal.protein ?? null,
        fat_g: meal.fat ?? null,
        carbs_g: meal.carbs ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorite_meals", userId] });
      toast.success("נוסף למועדפות");
    },
    onError: (err: Error) => toast.error("שגיאה: " + err.message),
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("favorite_meals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorite_meals", userId] });
      toast.success("הוסר ממועדפות");
    },
    onError: (err: Error) => toast.error("שגיאה: " + err.message),
  });

  const logFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("לא מחובר");
      const meal = favoritesQuery.data?.find((m) => m.id === id);
      if (!meal) throw new Error("ארוחה לא נמצאה");
      const { error } = await supabase.from("nutrition_entries").insert({
        user_id: userId,
        name: meal.name,
        meal_type: autoMealTypeHebrew(),
        calories: meal.calories ?? null,
        protein_g: meal.protein_g ?? null,
        carbs_g: meal.carbs_g ?? null,
        fat_g: meal.fat_g ?? null,
        date: todayLocalStr(),
      });
      if (error) throw error;
      return meal;
    },
    onSuccess: (meal) => {
      qc.invalidateQueries({ queryKey: ["nutrition-entries"] });
      toast.success(`✓ ${meal.name} נרשם — ${meal.calories ?? 0} קל`);
    },
    onError: (err: Error) => toast.error("שגיאה: " + err.message),
  });

  return {
    favorites: favoritesQuery.data ?? [],
    isLoading: favoritesQuery.isLoading,
    addFavorite: addFavoriteMutation.mutate,
    removeFavorite: removeFavoriteMutation.mutate,
    logFavorite: logFavoriteMutation.mutate,
  };
}
