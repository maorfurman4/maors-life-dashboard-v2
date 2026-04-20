import { UtensilsCrossed, Trash2, Clock } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useNutritionEntries, useDeleteNutrition } from "@/hooks/use-sport-data";
import { toast } from "sonner";

export function NutritionMealCards() {
  const { data: meals, isLoading } = useNutritionEntries();
  const deleteNutrition = useDeleteNutrition();

  const handleDelete = (id: string) => {
    deleteNutrition.mutate(id, {
      onSuccess: () => toast.success("ארוחה נמחקה"),
      onError: (err) => toast.error("שגיאה: " + err.message),
    });
  };

  const totalCalories = meals?.reduce((s, m) => s + (m.calories ?? 0), 0) ?? 0;
  const totalProtein = meals?.reduce((s, m) => s + (m.protein_g ?? 0), 0) ?? 0;

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-muted-foreground" style={{ letterSpacing: 0 }}>
          ארוחות היום
        </h3>
        {(meals?.length ?? 0) > 0 && (
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span>{totalCalories} קל׳</span>
            <span>{totalProtein.toFixed(0)}g חלבון</span>
          </div>
        )}
      </div>

      {isLoading && <div className="text-xs text-muted-foreground text-center py-3">טוען...</div>}

      {!isLoading && meals && meals.length > 0 ? (
        <div className="space-y-2">
          {meals.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="h-8 w-8 rounded-xl bg-nutrition/10 flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-nutrition" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{m.name}</p>
                  <div className="flex gap-2.5 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                    {m.calories != null && <span>{m.calories} קל׳</span>}
                    {m.protein_g != null && <span>{m.protein_g}g חלבון</span>}
                    {m.carbs_g != null && <span>{m.carbs_g}g פחמ׳</span>}
                    {m.fat_g != null && <span>{m.fat_g}g שומן</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <EmptyState
          icon={UtensilsCrossed}
          message="אין ארוחות עדיין — לחץ/י על 'הוסף ארוחה' כדי להתחיל"
          colorClass="text-nutrition"
        />
      ) : null}
    </div>
  );
}
