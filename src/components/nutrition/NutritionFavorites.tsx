import { Star, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  useFavoriteMeals,
  useDeleteFavoriteMeal,
  useAddNutrition,
} from "@/hooks/use-sport-data";
import { toast } from "sonner";

export function NutritionFavorites() {
  const { data: favorites, isLoading } = useFavoriteMeals();
  const deleteFavorite = useDeleteFavoriteMeal();
  const addNutrition = useAddNutrition();

  const handleQuickAdd = (fav: any) => {
    addNutrition.mutate(
      {
        name: fav.name,
        meal_type: "lunch",
        calories: fav.calories ?? undefined,
        protein_g: fav.protein_g ?? undefined,
        carbs_g: fav.carbs_g ?? undefined,
        fat_g: fav.fat_g ?? undefined,
      },
      {
        onSuccess: () => toast.success(`"${fav.name}" נוסף לארוחות היום`),
        onError: (err) => toast.error("שגיאה: " + err.message),
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    deleteFavorite.mutate(id, {
      onSuccess: () => toast.success(`"${name}" הוסר מהמועדפים`),
      onError: (err) => toast.error("שגיאה: " + err.message),
    });
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3" dir="rtl">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-nutrition" />
        <h3 className="text-sm font-semibold" style={{ letterSpacing: 0 }}>
          ארוחות מועדפות
        </h3>
      </div>

      {isLoading && <div className="text-xs text-muted-foreground py-2 text-center">טוען...</div>}

      {!isLoading && (!favorites || favorites.length === 0) && (
        <EmptyState
          icon={Star}
          message="אין מועדפים עדיין — שמור ארוחה כמועדפת מהחיפוש"
          colorClass="text-nutrition"
        />
      )}

      {!isLoading && favorites && favorites.length > 0 && (
        <div className="space-y-2">
          {favorites.map((fav: any) => (
            <div
              key={fav.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/20 p-3"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="h-7 w-7 rounded-xl bg-nutrition/10 flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="h-3 w-3 text-nutrition" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{fav.name}</p>
                  <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                    {fav.calories != null && <span>{fav.calories} קל׳</span>}
                    {fav.protein_g != null && <span>{fav.protein_g}g חלבון</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {/* One-click add to today */}
                <button
                  onClick={() => handleQuickAdd(fav)}
                  disabled={addNutrition.isPending}
                  className="h-7 w-7 rounded-lg bg-nutrition/10 flex items-center justify-center hover:bg-nutrition/20 transition-colors disabled:opacity-50"
                  title="הוסף לארוחות היום"
                >
                  <Plus className="h-3.5 w-3.5 text-nutrition" />
                </button>
                <button
                  onClick={() => handleDelete(fav.id, fav.name)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors"
                  title="הסר מהמועדפים"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
