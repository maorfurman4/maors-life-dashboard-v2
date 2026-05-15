import { X, Plus, Pencil, Sparkles } from "lucide-react";
import { useAddNutrition } from "@/hooks/use-sport-data";
import { type MealRecognitionResult } from "@/lib/ai-service";
import { toast } from "sonner";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getMealTypeByHour(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 20) return "snack";
  return "dinner";
}

const MEAL_TYPE_HE: Record<string, string> = {
  breakfast: "ארוחת בוקר",
  lunch:     "ארוחת צהריים",
  dinner:    "ארוחת ערב",
  snack:     "חטיף",
};

// ─── types ────────────────────────────────────────────────────────────────────

interface Props {
  result:    MealRecognitionResult;
  onAdd:     () => void;  // called after successful DB insert
  onEdit:    () => void;  // opens AddMealDrawer with prefill
  onDismiss: () => void;
}

// ─── component ───────────────────────────────────────────────────────────────

export function AIConfirmationCard({ result, onAdd, onEdit, onDismiss }: Props) {
  const addNutrition = useAddNutrition();
  const mealType     = getMealTypeByHour();

  const handleAdd = () => {
    addNutrition.mutate(
      {
        name:      result.name,
        meal_type: mealType,
        calories:  Math.round(result.calories),
        protein_g: Math.round(result.protein_g),
        carbs_g:   Math.round(result.carbs_g  ?? 0),
        fat_g:     Math.round(result.fat_g    ?? 0),
      },
      {
        onSuccess: () => { toast.success(`${result.name} נוסף ליומן!`); onAdd(); },
        onError:   (e: any) => toast.error(e?.message ?? "שגיאה בהוספה"),
      }
    );
  };

  const macros = [
    { label: "קלוריות", value: Math.round(result.calories),      unit: "קל׳", color: "text-emerald-400", border: "border-emerald-500/20" },
    { label: "חלבון",   value: Math.round(result.protein_g),     unit: "g",   color: "text-blue-400",   border: "border-blue-500/20"    },
    { label: "פחמימות", value: Math.round(result.carbs_g  ?? 0), unit: "g",   color: "text-amber-400",  border: "border-amber-500/20"   },
    { label: "שומן",    value: Math.round(result.fat_g    ?? 0), unit: "g",   color: "text-rose-400",   border: "border-rose-500/20"    },
  ];

  return (
    /* backdrop — click outside to dismiss */
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center pb-8 px-4 bg-black/60 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        dir="rtl"
        className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/8 backdrop-blur-2xl p-5 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <p className="text-[11px] font-black text-purple-400 uppercase">זוהה על ידי AI</p>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-white/40" />
          </button>
        </div>

        {/* ── Meal name ── */}
        <p className="text-xl font-black text-white leading-tight">{result.name}</p>

        {/* ── Macro grid ── */}
        <div className="grid grid-cols-4 gap-2">
          {macros.map((m) => (
            <div
              key={m.label}
              className={`rounded-2xl border ${m.border} bg-white/5 p-2.5 flex flex-col items-center gap-0.5`}
            >
              <p className={`text-sm font-black ${m.color}`}>{m.value}</p>
              <p className="text-[8px] text-white/35">{m.unit}</p>
              <p className="text-[8px] text-white/40">{m.label}</p>
            </div>
          ))}
        </div>

        {/* ── Suggested meal type badge ── */}
        <p className="text-center text-[11px] text-white/40">
          יוסף בתור:{" "}
          <span className="font-bold text-white/70">{MEAL_TYPE_HE[mealType]}</span>
        </p>

        {/* ── Action buttons ── */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white/70 text-sm font-bold hover:bg-white/10 active:scale-95 transition-all"
          >
            <Pencil className="h-3.5 w-3.5" />
            ערוך
          </button>
          <button
            onClick={handleAdd}
            disabled={addNutrition.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-sm font-black hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25"
          >
            <Plus className="h-4 w-4" />
            {addNutrition.isPending ? "מוסיף..." : "הוסף ליומן"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
