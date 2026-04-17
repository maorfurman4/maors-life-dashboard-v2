import { Star, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export function NutritionFavorites() {
  const favorites: unknown[] = [];

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-nutrition" />
          <h3 className="text-sm font-semibold text-muted-foreground">מועדפים</h3>
        </div>
      </div>
      {favorites.length === 0 ? (
        <EmptyState
          icon={Star}
          message="אין מועדפים עדיין — חפש מזון ושמור כמועדף"
          colorClass="text-nutrition"
        />
      ) : null}
    </div>
  );
}
