import { Scale } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export function NutritionWeightChart() {
  const data: unknown[] = [];

  return (
    <div className="rounded-2xl border border-nutrition/15 bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-nutrition" />
        <h3 className="text-sm font-bold">מגמת משקל</h3>
      </div>
      {data.length === 0 ? (
        <EmptyState
          icon={Scale}
          message="אין נתוני משקל — הוסף שקילות כדי לראות מגמה"
          colorClass="text-nutrition"
        />
      ) : null}
    </div>
  );
}
