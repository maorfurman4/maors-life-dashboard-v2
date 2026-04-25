import { useState } from "react";
import { Dumbbell, Footprints, Shuffle, Weight } from "lucide-react";
import { AddWorkoutDrawer } from "@/components/sport/AddWorkoutDrawer";

const categories = [
  {
    label: "קליסטניקס",
    icon: Dumbbell,
    value: "calisthenics",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80",
  },
  {
    label: "ריצה",
    icon: Footprints,
    value: "running",
    imageUrl: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=300&q=80",
  },
  {
    label: "משולב",
    icon: Shuffle,
    value: "combined",
    imageUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&q=80",
  },
  {
    label: "משקולות",
    icon: Weight,
    value: "weights",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80",
  },
];

export function SportQuickAdd() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">הוסף אימון מהיר</h3>
      <div className="grid grid-cols-4 gap-2">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => { setSelectedCategory(cat.value); setDrawerOpen(true); }}
            className="relative aspect-square rounded-2xl overflow-hidden transition-transform active:scale-95"
            style={{ backgroundImage: `url(${cat.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
          >
            {/* overlay */}
            <div className="absolute inset-0 bg-black/55" />
            {/* content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-1">
              <div className="h-8 w-8 rounded-xl bg-sport/25 border border-sport/30 flex items-center justify-center backdrop-blur-sm">
                <cat.icon className="h-4 w-4 text-sport" />
              </div>
              <span className="text-[10px] font-bold text-white text-center leading-tight">{cat.label}</span>
            </div>
          </button>
        ))}
      </div>
      <AddWorkoutDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} defaultCategory={selectedCategory} />
    </div>
  );
}
