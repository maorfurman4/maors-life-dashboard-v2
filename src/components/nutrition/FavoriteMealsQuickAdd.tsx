import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useFavoriteMeals } from "@/hooks/useFavoriteMeals";
import { haptics } from "@/lib/haptics";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function AddFavoriteSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (meal: { name: string; calories?: number; protein?: number; fat?: number; carbs?: number }) => void;
}) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");

  const reset = () => {
    setName(""); setCalories(""); setProtein(""); setFat(""); setCarbs("");
  };

  const handleSave = () => {
    if (!name.trim() || !calories.trim()) return;
    onSave({
      name: name.trim(),
      calories: calories ? parseInt(calories) : undefined,
      protein: protein ? parseFloat(protein) : undefined,
      fat: fat ? parseFloat(fat) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
    });
    reset();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-end">הוסף ארוחה מועדפת</SheetTitle>
        </SheetHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">שם *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: חזה עוף + אורז"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-nutrition min-h-[44px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "קלוריות *", value: calories, set: setCalories },
              { label: "חלבון (g)", value: protein, set: setProtein },
              { label: "שומן (g)", value: fat, set: setFat },
              { label: "פחמימות (g)", value: carbs, set: setCarbs },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-nutrition min-h-[44px]"
                  dir="ltr"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !calories.trim()}
            className="w-full py-3 rounded-xl bg-nutrition text-nutrition-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 min-h-[44px]"
          >
            שמור מועדפת
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function FavoriteMealsQuickAdd() {
  const { favorites, isLoading, logFavorite, removeFavorite, addFavorite } = useFavoriteMeals();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const longPressTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleTouchStart = (id: string) => {
    longPressTimers.current[id] = setTimeout(() => {
      haptics.tap();
      setOpenPopoverId(id);
    }, 500);
  };

  const handleTouchEnd = (id: string) => {
    clearTimeout(longPressTimers.current[id]);
  };

  const handleTap = (id: string) => {
    haptics.success();
    logFavorite(id);
  };

  if (isLoading) return null;

  const visibleFavorites = favorites.slice(0, 6);

  return (
    <>
      <div className="w-full">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">מועדפות</p>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-5 px-4 rounded-2xl border border-dashed border-white/15 bg-white/3">
            <p className="text-xs text-white/40 text-center leading-relaxed">
              הוסף ארוחות שאתה אוכל בדרך כלל לשם גישה מהירה
            </p>
            <button
              onClick={() => { haptics.tap(); setAddSheetOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nutrition/20 border border-nutrition/30 text-nutrition text-xs font-bold hover:bg-nutrition/30 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              הוסף ראשונה +
            </button>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {visibleFavorites.map((fav, i) => (
              <Popover
                key={fav.id}
                open={openPopoverId === fav.id}
                onOpenChange={(v) => { if (!v) setOpenPopoverId(null); }}
              >
                <PopoverTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => handleTap(fav.id)}
                    onContextMenu={(e: React.MouseEvent) => { e.preventDefault(); haptics.tap(); setOpenPopoverId(fav.id); }}
                    onTouchStart={() => handleTouchStart(fav.id)}
                    onTouchEnd={() => handleTouchEnd(fav.id)}
                    onTouchMove={() => handleTouchEnd(fav.id)}
                    className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors min-w-[72px] max-w-[88px]"
                  >
                    <span className="text-xl leading-none">🍽️</span>
                    <span className="text-[11px] font-semibold text-white/85 leading-tight text-center line-clamp-2 w-full">
                      {fav.name}
                    </span>
                    <span className="text-[10px] text-white/40 font-medium">
                      {fav.calories ?? "—"} קל׳
                    </span>
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-44 p-1.5 rounded-xl"
                  side="top"
                  align="center"
                >
                  <button
                    onClick={() => { haptics.success(); logFavorite(fav.id); setOpenPopoverId(null); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors text-end"
                  >
                    🍽️ רשום עכשיו
                  </button>
                  <button
                    onClick={() => { haptics.tap(); removeFavorite(fav.id); setOpenPopoverId(null); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors text-end"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    הסר ממועדפות
                  </button>
                </PopoverContent>
              </Popover>
            ))}

            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: visibleFavorites.length * 0.05, type: "spring", stiffness: 300, damping: 20 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => { haptics.tap(); setAddSheetOpen(true); }}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-2xl border border-dashed border-white/20 bg-white/3 hover:bg-white/8 transition-colors min-w-[64px]"
            >
              <Plus className="h-5 w-5 text-white/40" />
              <span className="text-[10px] text-white/30 font-medium">הוסף</span>
            </motion.button>
          </div>
        )}
      </div>

      <AddFavoriteSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onSave={addFavorite}
      />
    </>
  );
}
