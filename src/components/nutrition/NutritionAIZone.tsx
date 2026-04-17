import { Camera, Sparkles } from "lucide-react";

export function NutritionAIZone() {
  return (
    <div className="rounded-2xl border border-dashed border-nutrition/20 bg-nutrition/5 p-5 flex flex-col items-center gap-3 text-center">
      <div className="h-12 w-12 rounded-2xl bg-nutrition/10 flex items-center justify-center">
        <Camera className="h-6 w-6 text-nutrition" />
      </div>
      <div>
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Sparkles className="h-3.5 w-3.5 text-nutrition" />
          <h4 className="text-sm font-bold">זיהוי אוכל חכם</h4>
        </div>
        <p className="text-xs text-muted-foreground max-w-xs">
          בקרוב — צלם ארוחה והבינה המלאכותית תזהה את המרכיבים, הקלוריות והמאקרו אוטומטית.
        </p>
      </div>
      <button
        disabled
        className="px-4 py-2 rounded-lg bg-nutrition/10 text-nutrition text-xs font-semibold opacity-50 cursor-not-allowed"
      >
        בקרוב
      </button>
    </div>
  );
}
