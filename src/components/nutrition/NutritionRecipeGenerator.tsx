import { useState } from "react";
import { ChefHat, Loader2, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateText } from "@/lib/gemini";
import { useAddFavoriteMeal } from "@/hooks/use-sport-data";
import { toast } from "sonner";

interface Recipe {
  name: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  ingredients: string[];
  instructions: string[];
}

export function NutritionRecipeGenerator() {
  const [protein, setProtein] = useState("");
  const [calories, setCalories] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [people, setPeople] = useState("2");
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const addFavorite = useAddFavoriteMeal();

  const handleGenerate = async () => {
    if (!protein || !calories) {
      toast.error("נא למלא יעד חלבון וקלוריות");
      return;
    }
    setIsGenerating(true);
    setRecipe(null);
    try {
      const prompt = `צור מתכון בעברית שמכיל לפחות ${protein}g חלבון ובסביבות ${calories} קלוריות.
${restrictions ? `הגבלות תזונתיות: ${restrictions}` : ""}
ל-${people} אנשים.

החזר JSON בלבד (בלי markdown): {
  "name": "שם המתכון",
  "calories_per_serving": מספר,
  "protein_per_serving": מספר,
  "carbs_per_serving": מספר,
  "fat_per_serving": מספר,
  "ingredients": ["מרכיב 1", "מרכיב 2"],
  "instructions": ["שלב 1", "שלב 2"]
}`;
      const text = await generateText(prompt);
      const clean = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);
      setRecipe(parsed);
      setShowInstructions(false);
    } catch {
      toast.error("שגיאה ביצירת מתכון, נסה שנית");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveFavorite = async () => {
    if (!recipe) return;
    try {
      await addFavorite.mutateAsync({
        name: recipe.name,
        calories: recipe.calories_per_serving,
        protein_g: recipe.protein_per_serving,
        carbs_g: recipe.carbs_per_serving,
        fat_g: recipe.fat_per_serving,
      });
      toast.success("מתכון נשמר כמועדף");
    } catch {
      toast.error("שגיאה בשמירת המועדף");
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-nutrition/10 flex items-center justify-center">
          <ChefHat className="h-4 w-4 text-nutrition" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">מחולל מתכונים AI</h3>
          <p className="text-xs text-muted-foreground">צור מתכון לפי יעדי המאקרו שלך</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">חלבון יעד (g)</label>
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="למשל: 40"
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-nutrition"
            dir="ltr"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">קלוריות יעד</label>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="למשל: 600"
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-nutrition"
            dir="ltr"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">מספר אנשים</label>
          <input
            type="number"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            min="1"
            max="10"
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-nutrition"
            dir="ltr"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">הגבלות (אופציונלי)</label>
          <input
            type="text"
            value={restrictions}
            onChange={(e) => setRestrictions(e.target.value)}
            placeholder="טבעוני, ללא גלוטן..."
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-nutrition"
          />
        </div>
      </div>

      <Button
        className="w-full bg-nutrition hover:bg-nutrition/90 text-nutrition-foreground"
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            יוצר מתכון...
          </>
        ) : (
          <>
            <ChefHat className="h-4 w-4 ml-2" />
            צור מתכון
          </>
        )}
      </Button>

      {recipe && (
        <div className="space-y-3 pt-1">
          <div className="p-3 rounded-xl bg-secondary space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-base">{recipe.name}</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleSaveFavorite}
                disabled={addFavorite.isPending}
              >
                <Star className="h-3 w-3 ml-1 text-nutrition" />
                שמור מועדף
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {(
                [
                  ["קלוריות", recipe.calories_per_serving, ""],
                  ["חלבון", recipe.protein_per_serving, "g"],
                  ["פחמימות", recipe.carbs_per_serving, "g"],
                  ["שומן", recipe.fat_per_serving, "g"],
                ] as [string, number, string][]
              ).map(([label, val, unit]) => (
                <div key={label} className="bg-card rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold text-nutrition">
                    {val}
                    {unit}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-bold text-muted-foreground">מרכיבים</p>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-nutrition mt-0.5">•</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              className="flex items-center gap-1 text-xs font-semibold text-nutrition w-full"
              onClick={() => setShowInstructions((v) => !v)}
            >
              {showInstructions ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  הסתר הוראות הכנה
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  הצג הוראות הכנה
                </>
              )}
            </button>

            {showInstructions && (
              <ol className="space-y-2">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="h-5 w-5 rounded-full bg-nutrition/20 text-nutrition text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
