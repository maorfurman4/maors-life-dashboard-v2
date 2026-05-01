import { useState, useEffect } from "react";
import { User, Save } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

const GENDER_OPTIONS = ["זכר", "נקבה", "אחר", "מעדיף/ה לא לציין"];
const LIMITATION_OPTIONS = ["כתף", "גב תחתון", "ברך", "מרפק", "ירך", "קרסול", "אין מגבלות"];

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

export function SettingsPersonal() {
  const { data: profile } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [draft, setDraft] = useState({
    full_name: "",
    age: "",
    city: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    target_weight_kg: "",
    physical_limitations: [] as string[],
  });

  useEffect(() => {
    if (!profile) return;
    setDraft({
      full_name: profile.full_name ?? "",
      age: profile.age != null ? String(profile.age) : "",
      city: profile.city ?? "",
      gender: profile.gender ?? "",
      height_cm: profile.height_cm != null ? String(profile.height_cm) : "",
      weight_kg: profile.weight_kg != null ? String(profile.weight_kg) : "",
      target_weight_kg: profile.target_weight_kg != null ? String(profile.target_weight_kg) : "",
      physical_limitations: profile.physical_limitations ?? [],
    });
  }, [profile]);

  const toggleLimitation = (l: string) => {
    const curr = draft.physical_limitations;
    setDraft((d) => ({
      ...d,
      physical_limitations: curr.includes(l) ? curr.filter((x) => x !== l) : [...curr, l],
    }));
  };

  const handleSave = () => {
    updateProfile(
      {
        full_name: draft.full_name || null,
        age: draft.age ? Number(draft.age) : null,
        city: draft.city || null,
        gender: draft.gender || null,
        height_cm: draft.height_cm ? Number(draft.height_cm) : null,
        weight_kg: draft.weight_kg ? Number(draft.weight_kg) : null,
        target_weight_kg: draft.target_weight_kg ? Number(draft.target_weight_kg) : null,
        physical_limitations: draft.physical_limitations,
      },
      {
        onSuccess: () => toast.success("פרטים אישיים נשמרו"),
        onError: (e) => toast.error("שגיאה: " + e.message),
      }
    );
  };

  const inputCls = "w-full rounded-none bg-white/5 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white focus:bg-white/10 min-h-[44px] transition-colors";

  return (
    <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-none p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-white/70" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-widest">פרטים אישיים</h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/50 mb-1">שם מלא</label>
            <input type="text" value={draft.full_name}
              onChange={(e) => setDraft((d) => ({ ...d, full_name: e.target.value }))}
              placeholder="מאור" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">עיר</label>
            <input type="text" value={draft.city}
              onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
              placeholder="תל אביב" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/50 mb-1">גיל</label>
            <input type="number" value={draft.age}
              onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))}
              placeholder="25" dir="ltr" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">גובה (ס"מ)</label>
            <input type="number" value={draft.height_cm}
              onChange={(e) => setDraft((d) => ({ ...d, height_cm: e.target.value }))}
              placeholder="175" dir="ltr" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">משקל (ק"ג)</label>
            <input type="number" value={draft.weight_kg}
              onChange={(e) => setDraft((d) => ({ ...d, weight_kg: e.target.value }))}
              placeholder="75" dir="ltr" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">משקל יעד (ק"ג)</label>
            <input type="number" value={draft.target_weight_kg}
              onChange={(e) => setDraft((d) => ({ ...d, target_weight_kg: e.target.value }))}
              placeholder="70" dir="ltr" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">מגדר</label>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((g) => (
              <Chip key={g} label={g} selected={draft.gender === g}
                onClick={() => setDraft((d) => ({ ...d, gender: g }))} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">מגבלות גופניות</label>
          <div className="flex flex-wrap gap-2">
            {LIMITATION_OPTIONS.map((l) => (
              <Chip key={l} label={l} selected={draft.physical_limitations.includes(l)}
                onClick={() => toggleLimitation(l)} />
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={isPending}
        className="flex items-center gap-2 px-4 py-2.5 rounded-none bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 min-h-[44px]">
        <Save className="h-4 w-4" />
        {isPending ? "שומר..." : "שמור פרטים"}
      </button>
    </div>
  );
}
