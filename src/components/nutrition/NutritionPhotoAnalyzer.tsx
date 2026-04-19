import { useState, useRef } from "react";
import { Camera, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeImage } from "@/lib/gemini";
import { useAddNutrition } from "@/hooks/use-sport-data";
import { toast } from "sonner";

interface FoodAnalysis {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_type: string;
  red_labels: string[];
}

export function NutritionPhotoAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FoodAnalysis | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const addNutrition = useAddNutrition();
  const today = new Date().toISOString().slice(0, 10);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const base64 = await fileToBase64(file);
      const prompt = `נתח את תמונת האוכל. החזר JSON בלבד (בלי markdown): {"name": "שם המנה בעברית", "calories": מספר, "protein_g": מספר, "carbs_g": מספר, "fat_g": מספר, "meal_type": "breakfast|lunch|dinner|snack", "red_labels": [רשימת אזהרות אם קיימות: "סוכר גבוה" אם סוכר>13.3g/100g, "שומן רווי גבוה" אם שומן רווי>3g/100g, "נתרן גבוה" אם נתרן>600mg/100g]}`;
      const text = await analyzeImage(base64.split(",")[1], file.type, prompt);
      const clean = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch {
      toast.error("לא ניתן לנתח את התמונה");
    } finally {
      setIsAnalyzing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await addNutrition.mutateAsync({
        name: result.name,
        meal_type: result.meal_type as "breakfast" | "lunch" | "dinner" | "snack",
        calories: result.calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fat_g: result.fat_g,
        date: today,
      });
      setResult(null);
      toast.success("ארוחה נשמרה בהצלחה");
    } catch {
      toast.error("שגיאה בשמירת הארוחה");
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-nutrition/10 flex items-center justify-center">
          <Camera className="h-4 w-4 text-nutrition" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">זיהוי אוכל מתמונה</h3>
          <p className="text-xs text-muted-foreground">צלם או העלה תמונת ארוחה</p>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {!result ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileRef.current?.click()}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              מנתח...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 ml-2" />
              בחר תמונה
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-secondary space-y-2">
            <p className="font-semibold">{result.name}</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(
                [
                  ["קלוריות", result.calories, ""],
                  ["חלבון", result.protein_g, "g"],
                  ["פחמימות", result.carbs_g, "g"],
                  ["שומן", result.fat_g, "g"],
                ] as [string, number, string][]
              ).map(([label, val, unit]) => (
                <div key={label} className="bg-card rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold">
                    {val}
                    {unit}
                  </p>
                </div>
              ))}
            </div>
            {result.red_labels.length > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-xs text-destructive">{result.red_labels.join(" · ")}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={addNutrition.isPending}
            >
              {addNutrition.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "שמור ארוחה"
              )}
            </Button>
            <Button variant="outline" onClick={() => setResult(null)}>
              ביטול
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}
