import { useState } from "react";
import { Star, Plus, X, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserSettings, useUpdateUserSettings } from "@/hooks/use-sport-data";
import { SportCategorySelector } from "./SportCategorySelector";
import { toast } from "sonner";

interface SportFavorite {
  category: string;
  name: string;
}

interface Props {
  onSelect?: (workout: string) => void;
}

export function SportFavorites({ onSelect }: Props) {
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const [showSelector, setShowSelector] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const favorites: SportFavorite[] = (() => {
    try {
      const raw = (settings as any)?.sport_favorites;
      if (Array.isArray(raw)) return raw as SportFavorite[];
      if (typeof raw === "string") return JSON.parse(raw) as SportFavorite[];
    } catch {}
    return [];
  })();

  const saveFavorites = async (newFavs: SportFavorite[]) => {
    await updateSettings.mutateAsync({ sport_favorites: newFavs as any });
  };

  const handleAdd = async (name: string) => {
    const already = favorites.some((f) => f.name === name);
    if (already) {
      toast.info("כבר קיים במועדפים");
      setShowSelector(false);
      return;
    }
    try {
      const updated = [...favorites, { category: "כללי", name }];
      await saveFavorites(updated);
      setShowSelector(false);
      toast.success(`${name} נוסף למועדפים`);
    } catch {
      toast.error("שגיאה בשמירת המועדף");
    }
  };

  const handleRemove = async (name: string) => {
    setRemoving(name);
    try {
      const updated = favorites.filter((f) => f.name !== name);
      await saveFavorites(updated);
      toast.success(`${name} הוסר מהמועדפים`);
    } catch {
      toast.error("שגיאה בהסרת המועדף");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-sport/10 flex items-center justify-center">
            <Star className="h-4 w-4 text-sport" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">אימונים מועדפים</h3>
            <p className="text-xs text-muted-foreground">גישה מהירה לאימונים שלך</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-xl hover:bg-sport/10"
          onClick={() => setShowSelector((v) => !v)}
        >
          <Plus className="h-4 w-4 text-sport" />
        </Button>
      </div>

      {favorites.length === 0 && !showSelector && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">אין אימונים מועדפים עדיין</p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setShowSelector(true)}
          >
            <Plus className="h-3 w-3 ml-1" />
            הוסף מועדף
          </Button>
        </div>
      )}

      {favorites.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {favorites.map((fav) => (
            <div
              key={fav.name}
              className="flex items-center gap-1.5 bg-sport/10 border border-sport/20 rounded-full pl-2 pr-1 py-1.5 shrink-0 group"
            >
              <button
                onClick={() => onSelect?.(fav.name)}
                className="text-xs font-medium text-sport whitespace-nowrap pr-1"
              >
                {fav.name}
              </button>
              <button
                onClick={() => handleRemove(fav.name)}
                disabled={removing === fav.name}
                className="h-4 w-4 rounded-full bg-sport/20 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showSelector && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-muted-foreground">בחר אימון להוספה למועדפים</p>
          <SportCategorySelector onSelect={handleAdd} />
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowSelector(false)}
          >
            ביטול
          </Button>
        </div>
      )}
    </div>
  );
}
