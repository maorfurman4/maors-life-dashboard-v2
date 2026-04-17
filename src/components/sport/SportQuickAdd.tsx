import { useState } from "react";
import { Plus, Dumbbell, Footprints, Shuffle, Weight } from "lucide-react";
import { AddWorkoutDrawer } from "@/components/sport/AddWorkoutDrawer";

const categories = [
  { label: "קליסטניקס", icon: Dumbbell, value: "calisthenics" },
  { label: "ריצה", icon: Footprints, value: "running" },
  { label: "משולב", icon: Shuffle, value: "combined" },
  { label: "משקולות", icon: Weight, value: "weights" },
];

export function SportQuickAdd() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-muted-foreground">הוסף אימון מהיר</h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => { setSelectedCategory(cat.value); setDrawerOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sport/20 bg-sport/5 hover:bg-sport/15 transition-colors shrink-0 group"
          >
            <div className="h-7 w-7 rounded-lg bg-sport/15 flex items-center justify-center group-hover:shadow-[0_0_10px_rgba(0,255,135,0.3)] transition-shadow">
              <Plus className="h-3 w-3 text-sport" />
            </div>
            <span className="text-xs font-semibold text-sport/80 group-hover:text-sport whitespace-nowrap transition-colors">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
      <AddWorkoutDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} defaultCategory={selectedCategory} />
    </div>
  );
}
