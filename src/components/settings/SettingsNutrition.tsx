import { useState, useEffect } from "react";
import { Apple, Save } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

const DIET_TYPES = [
  "רגיל (הכל)", "טבעוני", "צמחוני", "ללא גלוטן",
  "ללא לקטוז", "קטוגני", "ים-תיכוני", "אחר",
];
const ALLERGY_OPTIONS = [
  "בוטנים", "אגוזים", "חלב", "ביצים",
  "גלוטן", "סויה", "דגים / פירות ים", "אחר", "אין אלרגיות",
];
const MACRO_OPTIONS = [
  "גבוה חלבון (30%+)", "מאוזן (40/30/30)",
  "גבוה פחמימות (ספורטאים)", "נמוך פחמימות", "לפי המלצת AI",
];

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold transition-all border rounded-none ${
        selected
          ? "bg-white text-black font-bold border-white"
          : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
      }`}>
      {label}
    </button>
  );
}

function toggle(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export function SettingsNutrition() {
  const { data: profile } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [draft, setDraft] = useState({
    diet_type: "",
    custom_diet: "",
    food_allergies: [] as string[],
    custom_allergy: "",
    macro_preference: "",
  });

  const [goals, setGoals] = useState({
    calories: "", trainingCalories: "",
    protein: "", trainingProtein: "",
    carbs: "", fat: "",
    waterMl: "", waterGlasses: "",
  });

  useEffect(() => {
    if (!profile) return;
    setDraft({
      diet_type: profile.diet_type ?? "",
      custom_diet: profile.custom_diet ?? "",
      food_allergies: profile.food_allergies ?? [],
      custom_allergy: profile.custom_allergy ?? "",
      macro_preference: profile.macro_preference ?? "",
    });
  }, [profile]);

  const handleSave = () => {
    updateProfile(
      {
        diet_type: draft.diet_type || null,
        custom_diet: draft.custom_diet || null,
        food_allergies: draft.food_allergies,
        custom_allergy: draft.custom_allergy || null,
        macro_preference: draft.macro_preference || null,
      },
      {
        onSuccess: () => toast.success("הגדרות תזונה נשמרו"),
        onError: (e) => toast.error("שגיאה: " + e.message),
      }
    );
  };

  const numFields: { key: keyof typeof goals; label: string; unit: string }[] = [
    { key: "calories",         label: "קלוריות — יום מנוחה",  unit: "kcal"   },
    { key: "trainingCalories", label: "קלוריות — יום אימון",   unit: "kcal"   },
    { key: "protein",          label: "חלבון — יום מנוחה",     unit: "g"      },
    { key: "trainingProtein",  label: "חלבון — יום אימון",      unit: "g"      },
    { key: "carbs",            label: "פחמימות",                unit: "g"      },
    { key: "fat",              label: "שומן",                   unit: "g"      },
    { key: "waterMl",          label: "מים יומי",               unit: "ml"     },
    { key: "waterGlasses",     label: "כוסות מים",              unit: "כוסות" },
  ];

  const numInputCls = "w-20 rounded-none bg-white/5 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white focus:bg-white/10 min-h-[44px] transition-colors";

  return (
    <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-none p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Apple className="h-4 w-4 text-white/70" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-widest">תזונה</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">סוג תזונה</label>
          <div className="flex flex-wrap gap-2">
            {DIET_TYPES.map((d) => (
              <Chip key={d} label={d} selected={draft.diet_type === d}
                onClick={() => setDraft((s) => ({ ...s, diet_type: d }))} />
            ))}
          </div>
          {draft.diet_type === "אחר" && (
            <input
              type="text"
              value={draft.custom_diet}
              onChange={(e) => setDraft((s) => ({ ...s, custom_diet: e.target.value }))}
              placeholder="פרט/י כאן..."
              dir="rtl"
              autoFocus
              className="mt-2 w-full rounded-none bg-white/5 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white focus:bg-white/10 min-h-[44px] transition-colors"
            />
          )}
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">אלרגיות למזון</label>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map((a) => (
              <Chip key={a} label={a} selected={draft.food_allergies.includes(a)}
                onClick={() => setDraft((s) => ({ ...s, food_allergies: toggle(s.food_allergies, a) }))} />
            ))}
          </div>
          {draft.food_allergies.includes("אחר") && (
            <input
              type="text"
              value={draft.custom_allergy}
              onChange={(e) => setDraft((s) => ({ ...s, custom_allergy: e.target.value }))}
              placeholder="פרט/י כאן..."
              dir="rtl"
              autoFocus
              className="mt-2 w-full rounded-none bg-white/5 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white focus:bg-white/10 min-h-[44px] transition-colors"
            />
          )}
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">העדפת מאקרו</label>
          <div className="flex flex-wrap gap-2">
            {MACRO_OPTIONS.map((m) => (
              <Chip key={m} label={m} selected={draft.macro_preference === m}
                onClick={() => setDraft((s) => ({ ...s, macro_preference: m }))} />
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-none bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 min-h-[44px]">
          <Save className="h-4 w-4" />
          {isPending ? "שומר..." : "שמור העדפות תזונה"}
        </button>

        <div className="pt-2 border-t border-white/10 space-y-3">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">יעדים כמותיים</p>
          {numFields.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-3">
              <label className="text-sm text-white/50">{f.label}</label>
              <div className="flex items-center gap-1.5">
                <input type="number" value={goals[f.key]}
                  onChange={(e) => setGoals((g) => ({ ...g, [f.key]: e.target.value }))}
                  placeholder="—" className={numInputCls} dir="ltr" />
                <span className="text-xs text-white/40 w-12">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
