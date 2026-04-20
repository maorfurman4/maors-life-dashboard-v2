import { useState } from "react";
import { Plus, UtensilsCrossed } from "lucide-react";
import { AddMealDrawer } from "@/components/nutrition/AddMealDrawer";

export function NutritionQuickAdd() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setDrawerOpen(true)}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border border-nutrition/20 bg-nutrition/5 hover:bg-nutrition/10 transition-colors group min-h-[52px]"
      >
        <div className="h-8 w-8 rounded-xl bg-nutrition/15 flex items-center justify-center group-hover:shadow-[0_0_12px_rgba(134,239,172,0.3)] transition-shadow">
          <Plus className="h-4 w-4 text-nutrition" />
        </div>
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-3.5 w-3.5 text-nutrition/70" />
          <span className="text-sm font-bold text-nutrition" style={{ letterSpacing: 0 }}>
            הוסף ארוחה
          </span>
        </div>
      </button>
      <AddMealDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
