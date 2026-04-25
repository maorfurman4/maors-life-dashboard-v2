import { useState } from "react";
import { Tag, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateText } from "@/lib/ai-service";
import { toast } from "sonner";

interface LabelAnalysis {
  product_name: string;
  overall_score: "טוב" | "בינוני" | "גרוע";
  score_color: "green" | "yellow" | "red";
  red_flags: string[];
  green_flags: string[];
  summary: string;
}

export function NutritionFoodLabels() {
  const [ingredients, setIngredients] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<LabelAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!ingredients.trim()) {
      toast.error("נא להזין רכיבים לניתוח");
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const prompt = `נתח את רשימת הרכיבים הבאה של מוצר מזון:
"${ingredients}"

החזר JSON בלבד (בלי markdown): {
  "product_name": "תיאור קצר של המוצר",
  "overall_score": "טוב|בינוני|גרוע",
  "score_color": "green|yellow|red",
  "red_flags": ["אזהרה 1 בעברית", "אזהרה 2 בעברית"],
  "green_flags": ["נקודה חיובית 1 בעברית", "נקודה חיובית 2 בעברית"],
  "summary": "סיכום קצר של 2-3 משפטים בעברית"
}

כלול red_flags: סוכרים מוספים, שמנים מוקשים, ממתיקים מלאכותיים, צבעי מאכל, חומרים משמרים מסוכנים, נתרן גבוה
כלול green_flags: מרכיבים טבעיים, ללא סוכר מוסף, עשיר בסיבים, מינימלית מעובד`;

      const text = await generateText(prompt);
      const clean = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch {
      toast.error("שגיאה בניתוח הרכיבים");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scoreColors = {
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    yellow: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    red: "text-destructive bg-destructive/10 border-destructive/20",
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-nutrition/10 flex items-center justify-center">
          <Tag className="h-4 w-4 text-nutrition" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">ניתוח תווית מוצר</h3>
          <p className="text-xs text-muted-foreground">העתק רשימת רכיבים לניתוח</p>
        </div>
      </div>

      <textarea
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        placeholder="הדבק כאן את רשימת הרכיבים מהמוצר..."
        rows={4}
        className="w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-nutrition resize-none"
      />

      <Button
        className="w-full"
        onClick={handleAnalyze}
        disabled={isAnalyzing || !ingredients.trim()}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            מנתח...
          </>
        ) : (
          <>
            <Tag className="h-4 w-4 ml-2" />
            נתח רכיבים
          </>
        )}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">{result.product_name}</p>
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full border ${scoreColors[result.score_color]}`}
            >
              {result.overall_score}
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">{result.summary}</p>

          {result.red_flags.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                אזהרות
              </p>
              {result.red_flags.map((flag, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20"
                >
                  <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{flag}</p>
                </div>
              ))}
            </div>
          )}

          {result.green_flags.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                נקודות חיוביות
              </p>
              {result.green_flags.map((flag, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20"
                >
                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-500">{flag}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
