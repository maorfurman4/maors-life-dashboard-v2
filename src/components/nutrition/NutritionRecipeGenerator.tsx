import { useState } from "react";
import { ChefHat, Loader2, Star, ChevronDown, ChevronUp, Clock, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddFavoriteMeal } from "@/hooks/use-sport-data";
import { useProfile } from "@/hooks/use-profile";
import { generateText, parseGeminiJson } from "@/lib/ai-service";
import { toast } from "sonner";

type DietaryType = "בשרי" | "חלבי" | "פרווה";

interface Recipe {
  name: string;
  dietary_type: DietaryType;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  prep_time_minutes: number;
  cook_time_minutes: number;
  ingredients: string[];
  instructions: string[];
  video_link?: string;
}

async function generateRecipeWithAI(
  protein: string,
  calories: string,
  people: string,
  dietaryType: DietaryType,
  excluded: string[]
): Promise<Recipe> {
  const excludedStr = excluded.length > 0 ? `מזונות אסורים (אסור להכניס): ${excluded.join(", ")}` : "אין הגבלות מיוחדות";
  const prompt = `אתה שף ישראלי מקצועי. צור מתכון ${dietaryType} בפורמט JSON בלבד.

פרמטרים:
- סוג: ${dietaryType}
- יעד חלבון למנה: ${protein}g
- יעד קלוריות למנה: ${calories} קל׳
- מספר מנות: ${people}
- ${excludedStr}

החזר JSON בדיוק:
{
  "name": "שם המתכון בעברית",
  "dietary_type": "${dietaryType}",
  "calories_per_serving": מספר,
  "protein_per_serving": מספר,
  "carbs_per_serving": מספר,
  "fat_per_serving": מספר,
  "prep_time_minutes": מספר,
  "cook_time_minutes": מספר,
  "ingredients": ["מרכיב + כמות", "..."],
  "instructions": ["שלב 1", "שלב 2", "..."],
  "video_link": ""
}
כללים: מתכון ישראלי אמיתי ומעשי. הקפד על ${dietaryType}. ללא markdown. JSON בלבד.`;

  const raw = await generateText(prompt);
  return parseGeminiJson<Recipe>(raw);
}

const DIETARY_OPTIONS: DietaryType[] = ["בשרי", "חלבי", "פרווה"];

export function NutritionRecipeGenerator() {
  const { data: profile } = useProfile();
  const addFavorite = useAddFavoriteMeal();

  const [dietaryType, setDietaryType] = useState<DietaryType | null>(null);
  const [protein, setProtein] = useState("");
  const [calories, setCalories] = useState("");
  const [people, setPeople] = useState("2");
  const [extraRestrictions, setExtraRestrictions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Build excluded list from user profile
  const profileExcluded: string[] = profile?.food_allergies ?? [];
  const allExcluded = [
    ...profileExcluded,
    ...extraRestrictions.split(",").map((s) => s.trim()).filter(Boolean),
  ];

  const handleGenerate = async () => {
    if (!dietaryType) {
      toast.error("בחר/י בשרי / חלבי / פרווה לפני יצירת מתכון");
      return;
    }
    if (!protein || !calories) {
      toast.error("נא למלא יעד חלבון וקלוריות");
      return;
    }
    setIsGenerating(true);
    setRecipe(null);
    try {
      const result = await generateRecipeWithAI(protein, calories, people, dietaryType, allExcluded);
      setRecipe(result);
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
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-nutrition/10 flex items-center justify-center">
          <ChefHat className="h-4 w-4 text-nutrition" />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ letterSpacing: 0 }}>מחולל מתכונים</h3>
          <p className="text-xs text-muted-foreground">מותאם להעדפות, מאקרו ומזונות אסורים</p>
        </div>
      </div>

      {/* Step 1: MANDATORY dietary type */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-muted-foreground">
          סוג הכשרות <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DIETARY_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setDietaryType(opt)}
              className={`py-2.5 rounded-xl text-xs font-bold border transition-colors min-h-[40px] ${
                dietaryType === opt
                  ? "border-nutrition/60 bg-nutrition/15 text-nutrition"
                  : "border-border bg-secondary/30 text-muted-foreground hover:border-nutrition/30"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {!dietaryType && (
          <p className="text-[10px] text-muted-foreground">יש לבחור לפני יצירת מתכון</p>
        )}
      </div>

      {/* Macro targets */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">חלבון יעד (g)</label>
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="40"
            className="w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-nutrition min-h-[40px]"
            dir="ltr"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">קלוריות יעד</label>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="600"
            className="w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-nutrition min-h-[40px]"
            dir="ltr"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">מספר מנות</label>
          <input
            type="number"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            min="1"
            max="10"
            className="w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-nutrition min-h-[40px]"
            dir="ltr"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">הגבלות נוספות</label>
          <input
            type="text"
            value={extraRestrictions}
            onChange={(e) => setExtraRestrictions(e.target.value)}
            placeholder="ללא גלוטן, אגוזים..."
            className="w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-nutrition min-h-[40px]"
          />
        </div>
      </div>

      {/* Excluded ingredients from profile */}
      {profileExcluded.length > 0 && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-2.5">
          <p className="text-[10px] font-bold text-destructive mb-1">מזונות אסורים מהפרופיל שלך (לעולם לא ייכללו):</p>
          <div className="flex flex-wrap gap-1">
            {profileExcluded.map((item) => (
              <span key={item} className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <Button
        className="w-full bg-nutrition hover:bg-nutrition/90 text-nutrition-foreground"
        onClick={handleGenerate}
        disabled={isGenerating || !dietaryType}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 ms-2 animate-spin" />
            יוצר מתכון...
          </>
        ) : (
          <>
            <ChefHat className="h-4 w-4 ms-2" />
            צור מתכון
          </>
        )}
      </Button>

      {recipe && (
        <div className="space-y-3 pt-1">
          <div className="p-3 rounded-xl bg-secondary space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-base leading-tight">{recipe.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-nutrition/10 text-nutrition border border-nutrition/20 font-semibold">
                  {recipe.dietary_type}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs shrink-0" onClick={handleSaveFavorite} disabled={addFavorite.isPending}>
                <Star className="h-3 w-3 ms-1 text-nutrition" />
                מועדף
              </Button>
            </div>

            {/* Timing */}
            <div className="flex gap-3 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                הכנה: {recipe.prep_time_minutes} דק׳
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                בישול: {recipe.cook_time_minutes} דק׳
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {people} מנות
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ["קלוריות", recipe.calories_per_serving, ""],
                ["חלבון", recipe.protein_per_serving, "g"],
                ["פחמימות", recipe.carbs_per_serving, "g"],
                ["שומן", recipe.fat_per_serving, "g"],
              ].map(([label, val, unit]) => (
                <div key={String(label)} className="bg-card rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold text-nutrition">{val}{unit}</p>
                </div>
              ))}
            </div>

            {/* Ingredients */}
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

            {/* Instructions toggle */}
            <button
              className="flex items-center gap-1 text-xs font-semibold text-nutrition w-full"
              onClick={() => setShowInstructions((v) => !v)}
            >
              {showInstructions ? (
                <><ChevronUp className="h-3 w-3" />הסתר הוראות הכנה</>
              ) : (
                <><ChevronDown className="h-3 w-3" />הצג הוראות הכנה</>
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

            {/* Video link */}
            {recipe.video_link && (
              <a
                href={recipe.video_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-nutrition font-semibold hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                סרטון הכנה
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
