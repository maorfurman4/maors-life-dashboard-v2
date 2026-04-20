import { useState, useRef } from "react";
import { ScanSearch, Loader2, AlertTriangle, FolderOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddNutrition, useAddFavoriteMeal } from "@/hooks/use-sport-data";
import { detectRedLabels, redLabelColor } from "@/lib/red-labels";
import { toast } from "sonner";

interface FoodAnalysis {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  red_labels: string[];
}

// Stub — replace analyzeImage call with real Gemini / Vision API when ready
async function analyzeImageStub(_base64: string, _mimeType: string): Promise<FoodAnalysis> {
  // TODO: connect to Gemini Vision / food recognition API
  return {
    name: "ממתין לחיבור AI — זיהוי תמונה",
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    red_labels: [],
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

export function NutritionPhotoAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FoodAnalysis | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const addNutrition = useAddNutrition();
  const addFavorite = useAddFavoriteMeal();
  const today = new Date().toISOString().slice(0, 10);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setIsAnalyzing(true);
    setResult(null);
    try {
      const b64 = await fileToBase64(file);
      const analysis = await analyzeImageStub(b64.split(",")[1], file.type);
      setResult(analysis);
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
        meal_type: "lunch",
        calories: result.calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fat_g: result.fat_g,
        date: today,
      });
      setResult(null);
      setPreview(null);
      toast.success("ארוחה נשמרה");
    } catch {
      toast.error("שגיאה בשמירת הארוחה");
    }
  };

  const handleSaveFavorite = async () => {
    if (!result) return;
    try {
      await addFavorite.mutateAsync({
        name: result.name,
        calories: result.calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fat_g: result.fat_g,
      });
      toast.success("נשמר כמועדף");
    } catch {
      toast.error("שגיאה");
    }
  };

  const allRedLabels = result
    ? [
        ...result.red_labels,
        ...detectRedLabels({ calories: result.calories }).map((l) => l.label),
      ]
    : [];

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-nutrition/10 flex items-center justify-center">
          <ScanSearch className="h-4 w-4 text-nutrition" />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ letterSpacing: 0 }}>
            זיהוי מזון מתמונה
          </h3>
          <p className="text-xs text-muted-foreground">העלה תמונה מהגלריה — AI מזהה מאקרו</p>
        </div>
      </div>

      {/* Gallery-only file picker (no camera) */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture={undefined}
        className="hidden"
        onChange={handleFile}
      />

      {!result && !isAnalyzing && (
        <div
          className="rounded-xl border-2 border-dashed border-border hover:border-nutrition/30 transition-colors cursor-pointer p-6"
          onClick={() => fileRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs font-semibold text-muted-foreground">בחר תמונה מהגלריה</p>
            <p className="text-[10px] text-muted-foreground/60">JPEG, PNG, HEIF · ללא גישה למצלמה</p>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex flex-col items-center gap-3 py-6">
          {preview && (
            <img src={preview} alt="preview" className="h-28 w-28 object-cover rounded-xl border border-border" />
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-nutrition" />
            מנתח תמונה...
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {preview && (
            <img src={preview} alt="meal" className="w-full h-36 object-cover rounded-xl border border-border" />
          )}
          <div className="p-3 rounded-xl bg-secondary space-y-2">
            <p className="font-semibold text-sm">{result.name}</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ["קלוריות", result.calories, ""],
                ["חלבון", result.protein_g, "g"],
                ["פחמימות", result.carbs_g, "g"],
                ["שומן", result.fat_g, "g"],
              ].map(([label, val, unit]) => (
                <div key={String(label)} className="bg-card rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold">{val}{unit}</p>
                </div>
              ))}
            </div>

            {allRedLabels.length > 0 && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-500">{[...new Set(allRedLabels)].join(" · ")}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 bg-nutrition hover:bg-nutrition/90 text-nutrition-foreground" onClick={handleSave} disabled={addNutrition.isPending}>
              {addNutrition.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "שמור ארוחה"}
            </Button>
            <Button variant="outline" onClick={handleSaveFavorite} disabled={addFavorite.isPending} className="px-3">
              <Star className="h-4 w-4 text-nutrition" />
            </Button>
            <Button variant="outline" onClick={() => { setResult(null); setPreview(null); }}>ביטול</Button>
          </div>
        </div>
      )}
    </div>
  );
}
