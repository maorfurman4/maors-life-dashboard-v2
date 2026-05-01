import { useState, useEffect, useRef } from "react";
import { User, Save, ChevronLeft } from "lucide-react";
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

// ── Hybrid Numeric Bottom Drawer ──────────────────────────────────────────────

interface DrawerConfig {
  field: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const ITEM_H = 56;

function buildValues(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  for (let v = min; v <= max; v = Math.round((v + step) * 100) / 100) {
    out.push(v);
  }
  return out;
}

function NumericDrawer({
  open, onClose, onConfirm, config, currentValue,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (val: string) => void;
  config: DrawerConfig | null;
  currentValue: string;
}) {
  const [typed, setTyped] = useState("");
  const [scrollVal, setScrollVal] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const values = config ? buildValues(config.min, config.max, config.step) : [];

  useEffect(() => {
    if (!open || !config) return;
    const num = parseFloat(currentValue);
    const initial = isNaN(num) ? config.min : Math.max(config.min, Math.min(config.max, num));
    setTyped(config.step < 1 ? initial.toFixed(1) : String(initial));
    setScrollVal(initial);

    setTimeout(() => {
      if (!listRef.current) return;
      const idx = values.findIndex((v) => Math.abs(v - initial) < config.step / 2);
      if (idx >= 0) listRef.current.scrollTop = idx * ITEM_H;
    }, 60);
  }, [open]);

  const handleScroll = () => {
    if (!listRef.current || !config) return;
    const idx = Math.round(listRef.current.scrollTop / ITEM_H);
    const val = values[Math.max(0, Math.min(idx, values.length - 1))];
    setScrollVal(val);
    setTyped(config.step < 1 ? val.toFixed(1) : String(val));
  };

  const handleTyped = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!config) return;
    setTyped(e.target.value);
    const num = parseFloat(e.target.value);
    if (!isNaN(num) && num >= config.min && num <= config.max) {
      const closest = values.reduce((p, c) => (Math.abs(c - num) < Math.abs(p - num) ? c : p));
      setScrollVal(closest);
      const idx = values.indexOf(closest);
      if (idx >= 0 && listRef.current) {
        listRef.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      }
    }
  };

  const handleConfirm = () => {
    if (!config) return;
    const num = parseFloat(typed);
    onConfirm(isNaN(num) ? String(scrollVal) : String(num));
    onClose();
  };

  if (!open || !config) return null;

  const paddingY = "calc(50% - 28px)";

  return (
    <>
      <div className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[100] bg-[#161311]/95 backdrop-blur-xl border-t border-white/20">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <span className="text-sm font-black text-white uppercase tracking-widest">{config.label}</span>
          <span className="text-xs text-white/40">{config.unit}</span>
        </div>

        {/* Scroll wheel */}
        <div className="relative h-56 overflow-hidden">
          {/* Center highlight */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-14 border-y border-white/20 bg-white/5 pointer-events-none z-10" />
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
            style={{ paddingTop: paddingY, paddingBottom: paddingY }}
          >
            {values.map((v) => (
              <div
                key={v}
                className={`snap-center h-14 flex items-center justify-center select-none transition-all duration-100 ${
                  Math.abs(v - scrollVal) < config.step / 2
                    ? "text-white text-3xl font-black"
                    : "text-white/20 text-base"
                }`}
              >
                {config.step < 1 ? v.toFixed(1) : v}
              </div>
            ))}
          </div>
        </div>

        {/* Manual type input */}
        <div className="px-5 py-3 border-t border-white/10">
          <label className="block text-[10px] text-white/30 mb-1 uppercase tracking-widest">הקלד ידנית</label>
          <input
            type="number"
            value={typed}
            onChange={handleTyped}
            min={config.min}
            max={config.max}
            step={config.step}
            dir="ltr"
            className="w-full rounded-none bg-white/5 border border-white/20 px-3 py-2.5 text-white text-center text-xl font-bold focus:outline-none focus:border-white focus:bg-white/10 transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 px-5 pt-2 pb-10">
          <button onClick={onClose}
            className="py-3 rounded-none border border-white/20 text-white/50 text-sm font-semibold hover:text-white hover:border-white/40 transition-colors">
            ביטול
          </button>
          <button onClick={handleConfirm}
            className="py-3 rounded-none bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors">
            אישור
          </button>
        </div>
      </div>
    </>
  );
}

// ── Trigger Button ─────────────────────────────────────────────────────────────

function NumericTrigger({
  label, value, unit, placeholder, onClick,
}: {
  label: string;
  value: string;
  unit: string;
  placeholder: string;
  onClick: () => void;
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1">{label}</label>
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-none bg-white/5 border border-white/20 px-3 min-h-[44px] flex items-center justify-between hover:bg-white/10 hover:border-white/40 transition-colors"
      >
        <span className={`text-sm ${value ? "text-white font-bold" : "text-white/20"}`}>
          {value || placeholder}
        </span>
        <span className="flex items-center gap-1 text-white/30 text-xs">
          {unit}
          <ChevronLeft className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

const NUMERIC_FIELDS: Record<string, DrawerConfig> = {
  age:              { field: "age",              label: "גיל",           unit: "שנים", min: 13,  max: 100, step: 1   },
  height_cm:        { field: "height_cm",        label: "גובה",          unit: "ס״מ",  min: 130, max: 230, step: 1   },
  weight_kg:        { field: "weight_kg",        label: "משקל",          unit: "ק״ג",  min: 30,  max: 200, step: 0.5 },
  target_weight_kg: { field: "target_weight_kg", label: "משקל יעד",      unit: "ק״ג",  min: 30,  max: 200, step: 0.5 },
};

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

  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

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

  const textInputCls = "w-full rounded-none bg-white/5 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white focus:bg-white/10 min-h-[44px] transition-colors";

  const activeConfig = activeDrawer ? NUMERIC_FIELDS[activeDrawer] : null;
  const activeValue = activeDrawer ? (draft as any)[activeDrawer] : "";

  return (
    <>
      <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-none p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-white/70" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-widest">פרטים אישיים</h3>
        </div>

        <div className="space-y-3">
          {/* Text fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">שם מלא</label>
              <input type="text" value={draft.full_name}
                onChange={(e) => setDraft((d) => ({ ...d, full_name: e.target.value }))}
                placeholder="מאור" className={textInputCls} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">עיר</label>
              <input type="text" value={draft.city}
                onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                placeholder="תל אביב" className={textInputCls} />
            </div>
          </div>

          {/* Numeric trigger buttons */}
          <div className="grid grid-cols-2 gap-3">
            <NumericTrigger label="גיל" value={draft.age} unit="שנים" placeholder="—"
              onClick={() => setActiveDrawer("age")} />
            <NumericTrigger label='גובה (ס"מ)' value={draft.height_cm} unit='ס"מ' placeholder="—"
              onClick={() => setActiveDrawer("height_cm")} />
            <NumericTrigger label='משקל (ק"ג)' value={draft.weight_kg} unit='ק"ג' placeholder="—"
              onClick={() => setActiveDrawer("weight_kg")} />
            <NumericTrigger label='משקל יעד (ק"ג)' value={draft.target_weight_kg} unit='ק"ג' placeholder="—"
              onClick={() => setActiveDrawer("target_weight_kg")} />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5">מגדר</label>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => (
                <Chip key={g} label={g} selected={draft.gender === g}
                  onClick={() => setDraft((d) => ({ ...d, gender: g }))} />
              ))}
            </div>
          </div>

          {/* Physical limitations */}
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

      {/* Hybrid Numeric Drawer */}
      <NumericDrawer
        open={!!activeDrawer}
        onClose={() => setActiveDrawer(null)}
        onConfirm={(val) => {
          if (activeDrawer) setDraft((d) => ({ ...d, [activeDrawer]: val }));
        }}
        config={activeConfig}
        currentValue={activeValue}
      />
    </>
  );
}
