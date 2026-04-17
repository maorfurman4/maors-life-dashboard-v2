import { useState } from "react";
import { Search, Plus, Loader2, Star, Check } from "lucide-react";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";

interface FoodResult {
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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
  const [mealType, setMealType] = useState("lunch");

  const searchFood = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,brands,nutriments,serving_size`
      );
      const data = await res.json();
      const items: FoodResult[] = (data.products || [])
        .filter((p: any) => p.product_name && p.nutriments)
        .map((p: any) => ({
          name: p.product_name,
          brand: p.brands || undefined,
          calories: Math.round(p.nutriments["energy-kcal_100g"] || p.nutriments["energy-kcal"] || 0),
          protein: Math.round((p.nutriments.proteins_100g || 0) * 10) / 10,
          carbs: Math.round((p.nutriments.carbohydrates_100g || 0) * 10) / 10,
          fat: Math.round((p.nutriments.fat_100g || 0) * 10) / 10,
          serving: p.serving_size || "100g",
        }));
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = (food: FoodResult, index: number) => {
    setSelectedFood(food);
  };

  const handleConfirmAdd = () => {
    if (!selectedFood) return;
    const idx = results.indexOf(selectedFood);
    if (idx >= 0) setAddedItems(prev => new Set(prev).add(idx));
    setSelectedFood(null);
    setQuantity("100");
  };

  const mealTypes = [
    { value: "breakfast", label: "בוקר" },
    { value: "lunch", label: "צהריים" },
    { value: "dinner", label: "ערב" },
    { value: "snack", label: "חטיף" },
  ];

  const qtyNum = parseFloat(quantity) || 100;
  const multiplier = qtyNum / 100;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">חיפוש מזון</h3>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchFood()}
            placeholder="חפש מזון... (לדוגמה: chicken, rice, banana)"
            className="w-full rounded-xl bg-secondary/40 border border-border pr-9 pl-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nutrition min-h-[44px]"
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
            return (
              <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${added ? "bg-nutrition/10 border border-nutrition/20" : "bg-secondary/20 hover:bg-secondary/35"}`}>
                <div className="flex-1 min-w-0" onClick={() => handleAddFood(r, i)}>
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  {r.brand && <p className="text-[10px] text-muted-foreground truncate">{r.brand}</p>}
                  <div className="flex gap-2 md:gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                    <span>{r.calories} kcal</span>
                    <span>P: {r.protein}g</span>
                    <span>C: {r.carbs}g</span>
                    <span>F: {r.fat}g</span>
                    <span className="text-muted-foreground/50">/ {r.serving}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleAddFood(r, i)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${added ? "bg-nutrition/20" : "bg-nutrition/10 hover:bg-nutrition/20"}`}
                >
                  {added ? <Check className="h-4 w-4 text-nutrition" /> : <Plus className="h-4 w-4 text-nutrition" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">לא נמצאו תוצאות — נסה לחפש באנגלית</p>
      )}

      {/* Quick add drawer for selected food */}
      <AddItemDrawer
        open={!!selectedFood}
        onClose={() => setSelectedFood(null)}
        title="הוסף מזון"
      >
        {selectedFood && (
          <div className="space-y-4">
            <div className="rounded-xl bg-secondary/30 p-3">
              <p className="text-sm font-bold">{selectedFood.name}</p>
              {selectedFood.brand && <p className="text-[10px] text-muted-foreground">{selectedFood.brand}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">כמות (גרם)</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-nutrition min-h-[44px]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">סוג ארוחה</label>
              <div className="grid grid-cols-4 gap-2">
                {mealTypes.map((mt) => (
                  <button
                    key={mt.value}
                    onClick={() => setMealType(mt.value)}
                    className={`py-2 rounded-xl border text-xs font-medium transition-colors min-h-[40px] ${
                      mealType === mt.value
                        ? "border-nutrition bg-nutrition/10 text-nutrition"
                        : "border-border hover:bg-secondary/40"
                    }`}
                  >
                    {mt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 rounded-xl bg-secondary/20 p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">קלוריות</p>
                <p className="text-sm font-bold">{Math.round(selectedFood.calories * multiplier)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">חלבון</p>
                <p className="text-sm font-bold">{(selectedFood.protein * multiplier).toFixed(1)}g</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">פחמימות</p>
                <p className="text-sm font-bold">{(selectedFood.carbs * multiplier).toFixed(1)}g</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">שומן</p>
                <p className="text-sm font-bold">{(selectedFood.fat * multiplier).toFixed(1)}g</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmAdd}
                className="flex-1 py-3 rounded-xl bg-nutrition text-nutrition-foreground font-bold text-sm hover:opacity-90 transition-opacity min-h-[44px]"
              >
                הוסף ארוחה
              </button>
              <button
                onClick={() => { handleConfirmAdd(); }}
                className="px-4 py-3 rounded-xl border border-nutrition/30 text-nutrition font-medium text-sm hover:bg-nutrition/10 transition-colors min-h-[44px]"
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
