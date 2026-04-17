import { Coffee, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useNutritionEntries, useDeleteNutrition } from "@/hooks/use-sport-data";
import { toast } from "sonner";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "ארוחת בוקר",
  lunch: "ארוחת צהריים",
  dinner: "ארוחת ערב",
  snack: "חטיף",
};

export function NutritionMealCards() {
  const { data: meals, isLoading } = useNutritionEntries();
  const deleteNutrition = useDeleteNutrition();

  const handleDelete = (id: string) => {
    deleteNutrition.mutate(id, {
      onSuccess: () => toast.success("ארוחה נמחקה"),
      onError: (err) => toast.error("שגיאה: " + err.message),
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-muted-foreground">ארוחות היום</h3>
      
      {isLoading && <div className="text-xs text-muted-foreground text-center py-3">טוען...</div>}
      
      {!isLoading && meals && meals.length > 0 ? (
        <div className="space-y-2">
          {meals.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{m.name}</span>
                  <span className="text-[10px] text-muted-foreground">{MEAL_LABELS[m.meal_type] || m.meal_type}</span>
                </div>
                <div className="flex gap-3 text-[10px] text-muted-foreground mt-1">
                  {m.calories && <span>{m.calories} קל׳</span>}
                  {m.protein_g && <span>{m.protein_g}g חלבון</span>}
                  {m.carbs_g && <span>{m.carbs_g}g פחמ׳</span>}
                  {m.fat_g && <span>{m.fat_g}g שומן</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(m.id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10">
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <EmptyState icon={Coffee} message="אין ארוחות עדיין — הוסף ארוחה כדי להתחיל" colorClass="text-nutrition" />
      ) : null}
    </div>
  );
}
