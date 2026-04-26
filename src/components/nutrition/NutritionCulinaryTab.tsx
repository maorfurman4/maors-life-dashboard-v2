import { useRef, useState } from "react";
import {
  Camera, Search, Sparkles, Loader2, ChevronDown, ChevronUp,
  Clock, Users, Flame, Zap,
} from "lucide-react";
import { recognizeMeal, generateText, parseGeminiJson } from "@/lib/ai-service";
import { toast } from "sonner";

// ─── types ───────────────────────────────────────────────────────────────────
interface RecipeResult {
  name:                  string;
  difficulty:            string;   // "קל" | "בינוני" | "מתקדם"
  time_minutes:          number;
  servings:              number;
  calories_per_serving:  number;
  protein_per_serving:   number;
  tags:                  string[];
  ingredients:           string[];
  steps:                 string[];
  tip:                   string;
}

// ─── quick-filter diets ───────────────────────────────────────────────────────
const DIET_FILTERS = [
  { key: "",              label: "הכל"         },
  { key: "ים תיכונית",   label: "🫒 ים תיכונית" },
  { key: "קטוגנית",      label: "🥑 קטו"       },
  { key: "טבעוני",       label: "🌱 טבעוני"    },
  { key: "חלבון גבוה",   label: "💪 חלבון גבוה" },
];

// ─── glass helpers ────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl bg-white/8 border border-white/15 text-white px-3 py-2.5 text-sm min-h-[44px] " +
  "focus:outline-none focus:border-emerald-500/60 placeholder:text-white/25 backdrop-blur-sm";

// ─── DifficultyBadge ─────────────────────────────────────────────────────────
function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    "קל":      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "בינוני":  "bg-amber-500/20   text-amber-300   border-amber-500/30",
    "מתקדם":   "bg-rose-500/20    text-rose-300    border-rose-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[difficulty] ?? "bg-white/10 text-white/50 border-white/10"}`}>
      {difficulty}
    </span>
  );
}

// ─── RecipeCard ───────────────────────────────────────────────────────────────
function RecipeCard({ recipe }: { recipe: RecipeResult }) {
  const [openSection, setOpenSection] = useState<"ingredients" | "steps" | null>("ingredients");

  const toggle = (s: "ingredients" | "steps") =>
    setOpenSection((prev) => (prev === s ? null : s));

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-black text-white leading-tight">{recipe.name}</p>
          <DifficultyBadge difficulty={recipe.difficulty} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { icon: Clock,  val: `${recipe.time_minutes}′`, label: "זמן"       },
            { icon: Users,  val: `×${recipe.servings}`,     label: "מנות"      },
            { icon: Flame,  val: `${recipe.calories_per_serving}`, label: "קל׳/מנה" },
            { icon: Zap,    val: `${recipe.protein_per_serving}g`, label: "חלבון"   },
          ].map(({ icon: Icon, val, label }) => (
            <div key={label} className="rounded-xl bg-white/5 border border-white/8 p-2">
              <Icon className="h-3 w-3 text-white/30 mx-auto mb-0.5" />
              <p className="text-xs font-black text-white/80">{val}</p>
              <p className="text-[8px] text-white/30">{label}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        {recipe.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-[9px] text-white/50">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Ingredients accordion ── */}
      <div className="border-t border-white/8">
        <button
          onClick={() => toggle("ingredients")}
          className="w-full flex items-center justify-between px-5 py-3"
        >
          <span className="text-xs font-black text-white/70">🛒 מרכיבים ({recipe.ingredients?.length ?? 0})</span>
          {openSection === "ingredients"
            ? <ChevronUp   className="h-3.5 w-3.5 text-white/40" />
            : <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
        </button>
        {openSection === "ingredients" && (
          <div className="px-5 pb-4 space-y-1.5">
            {recipe.ingredients?.map((ing, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500/60 shrink-0" />
                <p className="text-sm text-white/70 leading-snug">{ing}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Steps accordion ── */}
      <div className="border-t border-white/8">
        <button
          onClick={() => toggle("steps")}
          className="w-full flex items-center justify-between px-5 py-3"
        >
          <span className="text-xs font-black text-white/70">👨‍🍳 הוראות הכנה ({recipe.steps?.length ?? 0} שלבים)</span>
          {openSection === "steps"
            ? <ChevronUp   className="h-3.5 w-3.5 text-white/40" />
            : <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
        </button>
        {openSection === "steps" && (
          <div className="px-5 pb-4 space-y-3">
            {recipe.steps?.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-black text-emerald-400 flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-white/70 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip */}
      {recipe.tip && (
        <div className="border-t border-white/8 px-5 py-3">
          <p className="text-[10px] text-amber-400/80 leading-relaxed">
            💡 <span className="font-semibold">טיפ:</span> {recipe.tip}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function NutritionCulinaryTab() {
  // ── Fridge Scanner state ──
  const fileRef                   = useRef<HTMLInputElement>(null);
  const [scanning, setScanning]   = useState(false);
  const [scanIngredients, setScanIngredients] = useState<string[]>([]);
  const [scanDone, setScanDone]   = useState(false);

  // ── Recipe Generator state ──
  const [query,       setQuery]       = useState("");
  const [dietFilter,  setDietFilter]  = useState("");
  const [generating,  setGenerating]  = useState(false);
  const [recipes,     setRecipes]     = useState<RecipeResult[]>([]);

  // ─── Scan image → extract ingredients ────────────────────────────────────
  const handleScan = async (file: File) => {
    setScanning(true);
    setScanDone(false);
    setScanIngredients([]);
    setRecipes([]);
    try {
      const b64 = await fileToBase64(file);
      const result = await recognizeMeal(b64);
      // use items list as ingredients
      const ings = result.items?.length ? result.items : [result.name];
      setScanIngredients(ings);
      setScanDone(true);
      setQuery(ings.join(", "));
      toast.success(`זוהו ${ings.length} מרכיבים!`);
    } catch {
      toast.error("לא הצלחתי לזהות מרכיבים — נסה תמונה אחרת");
    } finally {
      setScanning(false);
    }
  };

  // ─── Generate recipes from query ─────────────────────────────────────────
  const generateRecipes = async () => {
    if (!query.trim()) { toast.error("הכנס חומרים או שם מנה"); return; }
    setGenerating(true);
    setRecipes([]);
    try {
      const dietClause = dietFilter ? `\n- דיאטה: ${dietFilter}` : "";
      const prompt = `אתה שף ישראלי מקצועי. צור 3 מתכונים מפורטים בפורמט JSON בלבד.

בקשה: "${query}"${dietClause}

פורמט JSON חובה:
{
  "recipes": [
    {
      "name": "שם המנה בעברית",
      "difficulty": "קל",
      "time_minutes": 20,
      "servings": 2,
      "calories_per_serving": 350,
      "protein_per_serving": 25,
      "tags": ["בריא", "מהיר"],
      "ingredients": ["100g עוף", "2 כפות שמן זית"],
      "steps": ["שלב 1: ...", "שלב 2: ..."],
      "tip": "טיפ להגשה מושלמת"
    }
  ]
}

כללים: מתכונים ישראליים ריאליים. difficulty: קל/בינוני/מתקדם. JSON בלבד.`;

      const raw    = await generateText(prompt);
      const parsed = parseGeminiJson<{ recipes: RecipeResult[] }>(raw);
      setRecipes(parsed.recipes ?? []);
    } catch {
      toast.error("שגיאה ביצירת מתכונים — נסה שנית");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="px-4 pt-4 space-y-5 pb-4">

      {/* ══ FRIDGE SCANNER ══════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📸</span>
          <div>
            <p className="text-sm font-black text-white">סריקת מקרר</p>
            <p className="text-[10px] text-white/40">צלם מרכיבים — AI ימצא מתכונים מתאימים</p>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleScan(f);
            e.target.value = "";
          }}
        />

        {/* Scan button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-white/20 bg-white/3 hover:bg-white/8 hover:border-white/30 transition-all min-h-[56px] disabled:opacity-50"
        >
          {scanning ? (
            <>
              <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
              <span className="text-sm text-purple-300 font-bold">מזהה מרכיבים...</span>
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-white/60 font-bold">צלם / בחר תמונה מהגלריה</span>
            </>
          )}
        </button>

        {/* Scan results */}
        {scanDone && scanIngredients.length > 0 && (
          <div className="rounded-2xl border border-purple-500/25 bg-purple-500/8 p-4 space-y-2">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
              זוהו {scanIngredients.length} מרכיבים
            </p>
            <div className="flex flex-wrap gap-1.5">
              {scanIngredients.map((ing) => (
                <span key={ing}
                  className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-200 text-xs font-semibold">
                  {ing}
                </span>
              ))}
            </div>
            <p className="text-[9px] text-white/30">המרכיבים הועתקו לשדה החיפוש — לחץ "צור מתכונים"</p>
          </div>
        )}
      </div>

      {/* ══ RECIPE GENERATOR ════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">👨‍🍳</span>
          <div>
            <p className="text-sm font-black text-white">מחולל מתכונים AI</p>
            <p className="text-[10px] text-white/40">כתוב מרכיבים, שם מנה, או בקשה חופשית</p>
          </div>
        </div>

        {/* Search input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateRecipes()}
            placeholder="עוף, ברוקולי, לימון... או 'פסטה עם ירקות'"
            className={inputCls + " flex-1"}
          />
          <button
            onClick={generateRecipes}
            disabled={generating}
            className="px-4 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-bold hover:bg-white/15 transition-colors min-h-[44px] disabled:opacity-40 shrink-0"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Diet filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {DIET_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setDietFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
                dietFilter === f.key
                  ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Generate button */}
        <button
          onClick={generateRecipes}
          disabled={generating || !query.trim()}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-sm transition-all min-h-[56px] ${
            query.trim()
              ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-2xl shadow-amber-500/25 active:scale-[0.98]"
              : "bg-white/10 border border-white/10 opacity-40 cursor-not-allowed"
          } disabled:opacity-50`}
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>יוצר מתכונים...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              <span>צור מתכונים AI ✨</span>
            </>
          )}
        </button>
      </div>

      {/* ══ RESULTS ═════════════════════════════════════════════════════════ */}
      {recipes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-black text-white">{recipes.length} מתכונים נוצרו</p>
          </div>
          {recipes.map((r, i) => (
            <RecipeCard key={i} recipe={r} />
          ))}
        </div>
      )}

      {/* bottom padding */}
      <div className="h-16" />
    </div>
  );
}

// ─── file → base64 ────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the data:image/...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
