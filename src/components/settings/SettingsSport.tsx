import { useState, useEffect } from "react";
import { Dumbbell, Save } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

const SPORT_TYPES = [
  "כוח / חדר כושר", "ריצה", "יוגה", "פילאטס", "שחייה", "אופניים",
  "CrossFit", "בוקסינג / אומנויות לחימה", "כדורגל / כדורסל",
  "טניס / פדל", "הליכה / טיולים", "ספורט אחר",
];
const SPORT_GOALS = [
  "ירידה במשקל", "עלייה במסת שריר", "כוח מרבי", "סיבולת לב-ריאה",
  "גמישות ושיווי משקל", "בריאות כללית", "ביצועים תחרותיים",
];
const MUSCLE_FOCUS = [
  "חזה", "גב", "כתפיים", "ידיים (ביספס / טריספס)",
  "בטן / קור", "ישבן", "רגליים", "כל הגוף",
];
const FREQUENCY_OPTIONS = [
  "פחות מפעם בשבוע", "1–2 פעמים בשבוע", "3–4 פעמים בשבוע", "5+ פעמים בשבוע",
];
const LOCATION_OPTIONS = ["חדר כושר", "הבית", "בחוץ / פארק", "שילוב"];
const LEVEL_OPTIONS = ["מתחיל", "בינוני", "מתקדם", "ספורטאי"];

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

export function SettingsSport() {
  const { data: profile } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [draft, setDraft] = useState({
    sport_types: [] as string[],
    custom_sport: "",
    sport_goals: [] as string[],
    muscle_focus: [] as string[],
    sport_frequency: "",
    sport_location: "",
    sport_level: "",
  });

  useEffect(() => {
    if (!profile) return;
    setDraft({
      sport_types: profile.sport_types ?? [],
      custom_sport: profile.custom_sport ?? "",
      sport_goals: profile.sport_goals ?? [],
      muscle_focus: profile.muscle_focus ?? [],
      sport_frequency: profile.sport_frequency ?? "",
      sport_location: profile.sport_location ?? "",
      sport_level: profile.sport_level ?? "",
    });
  }, [profile]);

  const handleSave = () => {
    updateProfile(
      {
        sport_types: draft.sport_types,
        custom_sport: draft.custom_sport || null,
        sport_goals: draft.sport_goals,
        muscle_focus: draft.muscle_focus,
        sport_frequency: draft.sport_frequency || null,
        sport_location: draft.sport_location || null,
        sport_level: draft.sport_level || null,
      },
      {
        onSuccess: () => toast.success("הגדרות ספורט נשמרו"),
        onError: (e) => toast.error("שגיאה: " + e.message),
      }
    );
  };

  return (
    <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-none p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-4 w-4 text-white/70" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-widest">ספורט ואימונים</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">סוגי ספורט</label>
          <div className="flex flex-wrap gap-2">
            {SPORT_TYPES.map((s) => (
              <Chip key={s} label={s} selected={draft.sport_types.includes(s)}
                onClick={() => setDraft((d) => ({ ...d, sport_types: toggle(d.sport_types, s) }))} />
            ))}
          </div>
          {draft.sport_types.includes("ספורט אחר") && (
            <input
              type="text"
              value={draft.custom_sport}
              onChange={(e) => setDraft((d) => ({ ...d, custom_sport: e.target.value }))}
              placeholder="פרט/י כאן..."
              dir="rtl"
              autoFocus
              className="mt-2 w-full rounded-none bg-white/5 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white focus:bg-white/10 min-h-[44px] transition-colors"
            />
          )}
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">יעדי ספורט</label>
          <div className="flex flex-wrap gap-2">
            {SPORT_GOALS.map((g) => (
              <Chip key={g} label={g} selected={draft.sport_goals.includes(g)}
                onClick={() => setDraft((d) => ({ ...d, sport_goals: toggle(d.sport_goals, g) }))} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">שרירים לשיפור</label>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_FOCUS.map((m) => (
              <Chip key={m} label={m} selected={draft.muscle_focus.includes(m)}
                onClick={() => setDraft((d) => ({ ...d, muscle_focus: toggle(d.muscle_focus, m) }))} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">תדירות</label>
            <div className="flex flex-col gap-1.5">
              {FREQUENCY_OPTIONS.map((f) => (
                <Chip key={f} label={f} selected={draft.sport_frequency === f}
                  onClick={() => setDraft((d) => ({ ...d, sport_frequency: f }))} />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">מקום</label>
              <div className="flex flex-col gap-1.5">
                {LOCATION_OPTIONS.map((l) => (
                  <Chip key={l} label={l} selected={draft.sport_location === l}
                    onClick={() => setDraft((d) => ({ ...d, sport_location: l }))} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">רמה</label>
              <div className="flex flex-col gap-1.5">
                {LEVEL_OPTIONS.map((l) => (
                  <Chip key={l} label={l} selected={draft.sport_level === l}
                    onClick={() => setDraft((d) => ({ ...d, sport_level: l }))} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={isPending}
        className="flex items-center gap-2 px-4 py-2.5 rounded-none bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 min-h-[44px]">
        <Save className="h-4 w-4" />
        {isPending ? "שומר..." : "שמור ספורט"}
      </button>
    </div>
  );
}
