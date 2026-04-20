import { useState } from "react";
import { Search, Plus, Loader2, Star, Check, AlertTriangle } from "lucide-react";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { useAddNutrition, useAddFavoriteMeal } from "@/hooks/use-sport-data";
import { detectRedLabels, redLabelColor } from "@/lib/red-labels";
import { toast } from "sonner";

interface FoodResult {
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  sodium?: number;
  saturated_fat?: number;
  serving: string;
}

export function NutritionFoodSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [quantity, setQuantity] = useState("100");

  const addNutrition = useAddNutrition();
  const addFavorite = useAddFavoriteMeal();

  const searchFood = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      // Israeli + global food search via Open Food Facts with IL country boost
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments,serving_size,countries_tags&tagtype_0=countries&tag_contains_0=contains&tag_0=israel`
      );
      const data = await res.json();

      // Fallback to global if no IL results
      let products = (data.products || []).filter((p: any) => p.product_name && p.nutriments);
      if (products.length < 3) {
        const res2 = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,brands,nutriments,serving_size`
        );
        const data2 = await res2.json();
        products = (data2.products || []).filter((p: any) => p.product_name && p.nutriments);
      }

      const items: FoodResult[] = products.map((p: any) => ({
        name: p.product_name,
        brand: p.brands || undefined,
        calories: Math.round(p.nutriments["energy-kcal_100g"] ?? p.nutriments["energy-kcal"] ?? 0),
        protein: Math.round((p.nutriments.proteins_100g ?? 0) * 10) / 10,
        carbs: Math.round((p.nutriments.carbohydrates_100g ?? 0) * 10) / 10,
        fat: Math.round((p.nutriments.fat_100g ?? 0) * 10) / 10,
        sugar: p.nutriments.sugars_100g,
        sodium: p.nutriments.sodium_100g != null ? p.nutriments.sodium_100g * 1000 : undefined, // g→mg
        saturated_fat: p.nutriments["saturated-fat_100g"],
        serving: p.serving_size || "100g",
      }));
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const qtyNum = parseFloat(quantity) || 100;
  const multiplier = qtyNum / 100;

  const handleConfirmAdd = () => {
    if (!selectedFood) return;
    const idx = results.indexOf(selectedFood);
    addNutrition.mutate(
      {
        name: selectedFood.name,
        meal_type: "lunch",
        calories: Math.round(selectedFood.calories * multiplier),
        protein_g: parseFloat((selectedFood.protein * multiplier).toFixed(1)),
        carbs_g: parseFloat((selectedFood.carbs * multiplier).toFixed(1)),
        fat_g: parseFloat((selectedFood.fat * multiplier).toFixed(1)),
      },
      {
        onSuccess: () => {
          toast.success(`"${selectedFood.name}" נוסף`);
          if (idx >= 0) setAddedItems((prev) => new Set(prev).add(idx));
          setSelectedFood(null);
          setQuantity("100");
        },
        onError: (err) => toast.error("שגיאה: " + err.message),
      }
    );
  };

  const handleSaveFavorite = () => {
    if (!selectedFood) return;
    addFavorite.mutate(
      {
        name: selectedFood.name,
        calories: Math.round(selectedFood.calories * multiplier),
        protein_g: parseFloat((selectedFood.protein * multiplier).toFixed(1)),
        carbs_g: parseFloat((selectedFood.carbs * multiplier).toFixed(1)),
        fat_g: parseFloat((selectedFood.fat * multiplier).toFixed(1)),
      },
      {
        onSuccess: () => toast.success("נשמר כמועדף"),
        onError: (err) => toast.error("שגיאה: " + err.message),
      }
    );
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3" dir="rtl">
      <h3 className="text-sm font-semibold text-muted-foreground" style={{ letterSpacing: 0 }}>
        חיפוש מוצרי מזון
      </h3>
      <p className="text-[10px] text-muted-foreground -mt-1">
        מאגר ישראלי + עולמי · כולל מדבקות אדומות לפי קריטריוני משרד הבריאות
      </p>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchFood()}
            placeholder="חפש: חומוס, גבינה לבנה, בננה..."
            className="w-full rounded-xl bg-secondary/40 border border-border pe-9 ps-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nutrition min-h-[44px]"
          />
        </div>
        <button
          onClick={searchFood}
          disabled={loading || !query.trim()}
          className="px-4 rounded-xl bg-nutrition/15 text-nutrition text-sm font-medium hover:bg-nutrition/25 transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "חפש"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {results.map((r, i) => {
            const added = addedItems.has(i);
            const redLabels = detectRedLabels({
              calories: r.calories,
              sugar_g: r.sugar,
              sodium_mg: r.sodium,
              saturated_fat_g: r.saturated_fat,
            });
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${
                  added ? "bg-nutrition/10 border border-nutrition/20" : "bg-secondary/20 hover:bg-secondary/35"
                }`}
              >
                <div className="flex-1 min-w-0" onClick={() => setSelectedFood(r)}>
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  {r.brand && <p className="text-[10px] text-muted-foreground truncate">{r.brand}</p>}
                  <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground flex-wrap">
                    <span>{r.calories} קל׳</span>
                    <span>P:{r.protein}g</span>
                    <span>C:{r.carbs}g</span>
                    <span>F:{r.fat}g</span>
                    <span className="text-muted-foreground/50">/{r.serving}</span>
                  </div>
                  {redLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {redLabels.map((lb) => (
                        <span
                          key={lb.key}
                          className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${redLabelColor(lb.severity)}`}
                        >
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {lb.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedFood(r)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    added ? "bg-nutrition/20" : "bg-nutrition/10 hover:bg-nutrition/20"
                  }`}
                >
                  {added ? <Check className="h-4 w-4 text-nutrition" /> : <Plus className="h-4 w-4 text-nutrition" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">לא נמצאו תוצאות — נסה שם אחר</p>
      )}

      {/* Add food drawer */}
      <AddItemDrawer open={!!selectedFood} onClose={() => setSelectedFood(null)} title="הוסף מזון">
        {selectedFood && (
          <div className="space-y-4" dir="rtl">
            <div className="rounded-xl bg-secondary/30 p-3">
              <p className="text-sm font-bold">{selectedFood.name}</p>
              {selectedFood.brand && <p className="text-[10px] text-muted-foreground">{selectedFood.brand}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">כמות (גרם)</label>
              <div className="flex gap-1.5 mb-2">
                {[50, 100, 150, 200, 300].map((g) => (
                  <button
                    key={g}
                    onClick={() => setQuantity(g.toString())}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors min-h-[32px] ${
                      quantity === g.toString()
                        ? "bg-nutrition/20 text-nutrition border border-nutrition/40"
                        : "bg-secondary/30 text-muted-foreground border border-transparent"
                    }`}
                  >
                    {g}g
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-nutrition min-h-[44px]"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 rounded-xl bg-secondary/20 p-3">
              {[
                ["קלוריות", Math.round(selectedFood.calories * multiplier), ""],
                ["חלבון", (selectedFood.protein * multiplier).toFixed(1), "g"],
                ["פחמימות", (selectedFood.carbs * multiplier).toFixed(1), "g"],
                ["שומן", (selectedFood.fat * multiplier).toFixed(1), "g"],
              ].map(([label, val, unit]) => (
                <div key={String(label)} className="text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold">{val}{unit}</p>
                </div>
              ))}
            </div>

            {/* Red labels in drawer */}
            {(() => {
              const labels = detectRedLabels({
                calories: selectedFood.calories,
                sugar_g: selectedFood.sugar,
                sodium_mg: selectedFood.sodium,
                saturated_fat_g: selectedFood.saturated_fat,
              });
              return labels.length > 0 ? (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-orange-500 mb-0.5">מדבקות אדומות (משרד הבריאות)</p>
                    <p className="text-[11px] text-orange-500/80">{labels.map((l) => l.label).join(" · ")}</p>
                  </div>
                </div>
              ) : null;
            })()}

            <div className="flex gap-2">
              <button
                onClick={handleConfirmAdd}
                disabled={addNutrition.isPending}
                className="flex-1 py-3 rounded-xl bg-nutrition text-nutrition-foreground font-bold text-sm hover:opacity-90 transition-opacity min-h-[44px] disabled:opacity-50"
              >
                {addNutrition.isPending ? "מוסיף..." : "הוסף ארוחה"}
              </button>
              <button
                onClick={handleSaveFavorite}
                disabled={addFavorite.isPending}
                className="px-4 py-3 rounded-xl border border-nutrition/30 text-nutrition font-medium text-sm hover:bg-nutrition/10 transition-colors min-h-[44px]"
                title="שמור כמועדף"
              >
                <Star className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </AddItemDrawer>
    </div>
  );
}
