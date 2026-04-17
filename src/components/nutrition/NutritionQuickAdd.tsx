import { useState } from "react";
import { Plus, Coffee, Sun, Sunset, Moon } from "lucide-react";
import { AddMealDrawer } from "@/components/nutrition/AddMealDrawer";

const mealTypes = [
  { label: "בוקר", icon: Coffee, value: "breakfast" },
  { label: "צהריים", icon: Sun, value: "lunch" },
  { label: "ערב", icon: Sunset, value: "dinner" },
  { label: "חטיף", icon: Moon, value: "snack" },
];

export function NutritionQuickAdd() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | undefined>();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-muted-foreground">הוסף ארוחה</h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {mealTypes.map((mt) => (
          <button
            key={mt.label}
            onClick={() => { setSelectedType(mt.value); setDrawerOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-nutrition/15 bg-nutrition/5 hover:bg-nutrition/10 transition-colors shrink-0 group"
          >
            <div className="h-7 w-7 rounded-lg bg-nutrition/10 flex items-center justify-center">
              <Plus className="h-3 w-3 text-nutrition" />
            </div>
            <span className="text-xs font-semibold text-nutrition/80 group-hover:text-nutrition whitespace-nowrap transition-colors">
              {mt.label}
            </span>
          </button>
        ))}
      </div>
      <AddMealDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} defaultType={selectedType} />
    </div>
  );
}
