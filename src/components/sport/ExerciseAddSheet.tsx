import { useRef, useEffect, useState, useCallback } from "react";
import { Heart, Youtube, BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { MUSCLE_LABELS } from "@/lib/exercise-library";
import { useWorkoutTemplates, useUpdateWorkoutTemplate, useAddWorkoutTemplate } from "@/hooks/use-sport-data";
import exerciseImageUrlsJson from "@/data/exercise-image-urls.json";

const EXERCISE_IMAGE_URLS: Record<string, string> = exerciseImageUrlsJson as Record<string, string>;

const MUSCLE_EMOJI: Partial<Record<string, string>> = {
  chest: "💪", chest_upper: "💪", chest_lower: "💪", chest_mid: "💪",
  back: "🔙", lats: "🔙",
  legs: "🦵", quads: "🦵", hamstrings: "🦵", calves: "🦵",
  glutes: "🍑",
  shoulders: "🏋️",
  biceps: "💪", triceps: "💪",
  core: "🎯", abs: "🎯",
  fullbody: "🏃", cardio: "🏃",
};

// ── Inline WheelPicker ────────────────────────────────────────────────────────
const ITEM_H = 40;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2);

function WheelPicker({
  items,
  value,
  onChange,
  label,
}: {
  items: number[];
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localIdx, setLocalIdx] = useState(() => {
    const i = items.indexOf(value);
    return i >= 0 ? i : 0;
  });

  // Scroll to initial position on mount
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = localIdx * ITEM_H;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      if (clamped !== localIdx) {
        setLocalIdx(clamped);
        onChange(Number(items[clamped]));
      }
      // Snap to exact position
      el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
    }, 80);
  }, [items, localIdx, onChange]);

  const wheelH = VISIBLE * ITEM_H;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[9px] font-bold text-white/35 uppercase tracking-widest">{label}</p>
      <div
        className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 w-full"
        style={{ height: wheelH }}
      >
        {/* Selection highlight band */}
        <div
          className="absolute inset-x-0 pointer-events-none z-10 border-y border-white/20 bg-white/8"
          style={{ top: CENTER * ITEM_H, height: ITEM_H }}
        />
        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/65 to-transparent pointer-events-none z-10" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/65 to-transparent pointer-events-none z-10" />
        {/* Scrollable list */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-scroll scrollbar-none snap-y snap-mandatory"
          style={{
            paddingTop: CENTER * ITEM_H,
            paddingBottom: CENTER * ITEM_H,
            scrollbarWidth: "none",
          }}
        >
          {items.map((item, i) => {
            const dist = Math.abs(i - localIdx);
            return (
              <div
                key={i}
                className="snap-center flex items-center justify-center text-white font-black cursor-pointer select-none"
                style={{
                  height: ITEM_H,
                  opacity: dist === 0 ? 1 : dist === 1 ? 0.4 : 0.12,
                  transform: `scale(${dist === 0 ? 1.08 : dist === 1 ? 0.82 : 0.65})`,
                  fontSize: dist === 0 ? "1.15rem" : "0.85rem",
                  transition: "opacity 0.1s, transform 0.1s",
                }}
                onClick={() => {
                  setLocalIdx(i);
                  onChange(Number(item));
                  if (listRef.current) {
                    listRef.current.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
                  }
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const SETS_ITEMS = Array.from({ length: 10 }, (_, i) => i + 1);
const REPS_ITEMS = Array.from({ length: 30 }, (_, i) => i + 1);
const KG_ITEMS = Array.from({ length: 81 }, (_, i) => Math.round(i * 25) / 10); // 0, 2.5, 5, ..., 200

function parseRepsNum(r: string | number): number {
  const n = parseInt(String(r));
  return isNaN(n) ? 10 : Math.min(Math.max(n, 1), 30);
}

/**
 * Minimal exercise shape accepted by ExerciseAddSheet.
 * Compatible with both the full LibraryExercise (from exercise-library.ts)
 * and the local LibraryExercise defined inside sport.tsx.
 */
export interface ExerciseInfo {
  name: string;
  defaultSets: number;
  defaultReps: number | string;
  /** Array of muscle-group keys (full LibraryExercise) */
  muscleGroups?: string[];
  /** Preformatted muscle string (local sport.tsx type) */
  muscles?: string;
  /** Array form (full LibraryExercise) or string (local type) */
  equipment?: string | string[];
  /** Direct YouTube URL (full LibraryExercise) */
  youtube_link?: string;
  /** YouTube search query (local sport.tsx type) */
  youtubeQuery?: string;
}

// ── Main component ───────────────────────────────────────────────────────────
export interface ExerciseAddSheetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ex: ExerciseInfo & Record<string, any>;
  onClose: () => void;
  /** If provided — called immediately on "הוסף לאימון" (workout builder mode). */
  onConfirmWorkout?: (ex: ExerciseInfo, sets: number, reps: number, weightKg: number) => void;
  onConfirmSS?: (ex: ExerciseInfo) => void;
  onConfirmSSFromLibrary?: (ex: ExerciseInfo) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (name: string) => void;
}

type Step = "main" | "ss_choice" | "template_pick";

export function ExerciseAddSheet({
  ex,
  onClose,
  onConfirmWorkout,
  onConfirmSS,
  onConfirmSSFromLibrary,
  isFavorite = false,
  onToggleFavorite,
}: ExerciseAddSheetProps) {
  const [step, setStep] = useState<Step>("main");
  const [sets, setSets] = useState(Math.min(Math.max(ex.defaultSets, 1), 10));
  const [reps, setReps] = useState(parseRepsNum(ex.defaultReps));
  const [weight, setWeight] = useState(0);

  const { data: templates } = useWorkoutTemplates();
  const updateTemplate = useUpdateWorkoutTemplate();
  const addTemplate = useAddWorkoutTemplate();
  const userTemplates = ((templates ?? []) as any[]).filter((t: any) => !t.is_system);

  const imgUrl = EXERCISE_IMAGE_URLS[ex.name];
  const firstMuscleGroup = ex.muscleGroups?.[0] ?? "";
  const fallbackEmoji = MUSCLE_EMOJI[firstMuscleGroup] ?? "💪";

  // Support both muscleGroups (array) and muscles (string) variants
  const muscleText = ex.muscleGroups?.length
    ? ex.muscleGroups.map(m => MUSCLE_LABELS[m as keyof typeof MUSCLE_LABELS] ?? m).join(" · ")
    : (ex.muscles ?? "");

  // Support both equipment array and equipment string
  const equipText = Array.isArray(ex.equipment)
    ? ex.equipment.join(", ")
    : (ex.equipment ?? "");

  // Support both youtube_link (direct URL) and youtubeQuery (search)
  const youtubeHref = ex.youtube_link
    ?? (ex.youtubeQuery
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.youtubeQuery)}`
      : undefined);

  // ── "הוסף לאימון" ─────────────────────────────────────────────────────────
  const handleAddClick = () => {
    if (onConfirmWorkout) {
      onConfirmWorkout(ex, sets, reps, weight);
      toast.success(`${ex.name} נוסף לאימון ✓`);
      onClose();
    } else {
      setStep("template_pick");
    }
  };

  // ── Template add helpers ───────────────────────────────────────────────────
  const handleAddToTemplate = (t: any) => {
    const already = (t.exercises ?? []).some((e: any) => e.name === ex.name);
    if (already) { toast.info(`${ex.name} כבר קיים בתבנית`); onClose(); return; }
    updateTemplate.mutate({
      id: t.id,
      exercises: [...(t.exercises ?? []), { name: ex.name, sets, reps, weight_kg: weight }],
    });
    toast.success(`נוסף ל-${t.name} ✓`);
    onClose();
  };

  const handleCreateTemplate = () => {
    addTemplate.mutate({
      name: ex.name,
      category: "weights",
      exercises: [{ name: ex.name, sets, reps, weight_kg: weight }],
    });
    toast.success("תבנית חדשה נוצרה ✓");
    onClose();
  };

  const hasSSButtons = onConfirmSS || onConfirmSSFromLibrary;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-[#0f0f0f] border border-white/10 border-b-0 p-5 pb-10 animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5 shrink-0" />

        {/* ── MAIN step ─────────────────────────────────────────── */}
        {step === "main" && (
          <div className="flex flex-col gap-5 overflow-y-auto">
            {/* Header: image + name */}
            <div className="flex items-center gap-4">
              <div className="h-[60px] w-[60px] rounded-2xl overflow-hidden border border-white/12 shrink-0 flex items-center justify-center bg-white/5">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={ex.name}
                    className="w-full h-full object-contain bg-white p-0.5"
                  />
                ) : (
                  <span className="text-[2rem] leading-none">{fallbackEmoji}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-black text-white leading-tight">{ex.name}</p>
                {muscleText && (
                  <p className="text-[11px] text-white/45 mt-0.5 leading-tight">{muscleText}</p>
                )}
                {equipText && (
                  <p className="text-[10px] text-white/25 mt-0.5 leading-tight">{equipText}</p>
                )}
              </div>
            </div>

            {/* 3 scroll wheels */}
            <div className="grid grid-cols-3 gap-2.5">
              <WheelPicker items={SETS_ITEMS} value={sets} onChange={setSets} label="סטים" />
              <WheelPicker items={REPS_ITEMS} value={reps} onChange={setReps} label="חזרות" />
              <WheelPicker items={KG_ITEMS} value={weight} onChange={setWeight} label='ק"ג' />
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              {/* Heart + main CTA */}
              <div className="flex gap-2">
                {onToggleFavorite && (
                  <button
                    onClick={() => onToggleFavorite(ex.name)}
                    className={`h-14 w-14 shrink-0 rounded-2xl border flex items-center justify-center transition-all active:scale-90 ${
                      isFavorite
                        ? "border-red-400/40 bg-red-400/10"
                        : "border-white/12 bg-white/5 hover:border-red-400/30"
                    }`}
                  >
                    <Heart
                      className={`h-5 w-5 transition-all ${
                        isFavorite ? "text-red-400 fill-red-400" : "text-white/35"
                      }`}
                    />
                  </button>
                )}
                <button
                  onClick={handleAddClick}
                  className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white text-base font-black active:scale-[0.97] transition-all shadow-[0_0_24px_rgba(16,185,129,0.28)]"
                >
                  הוסף לאימון ✓
                </button>
              </div>

              {/* SS button */}
              {hasSSButtons && (
                <button
                  onClick={() => setStep("ss_choice")}
                  className="w-full py-3.5 rounded-2xl border border-purple-500/40 bg-purple-500/10 text-purple-300 text-sm font-black active:scale-[0.97] transition-all hover:bg-purple-500/15"
                >
                  <span className="font-black">SS</span> · הוסף כ-Super Set
                </button>
              )}

              {/* YouTube */}
              {youtubeHref && (
                <a
                  href={youtubeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/18 text-red-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-500/18 transition-all"
                >
                  <Youtube className="h-4 w-4" /> צפה בסרטון הדרכה
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── TEMPLATE PICK step ─────────────────────────────────── */}
        {step === "template_pick" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <button
              onClick={() => setStep("main")}
              className="text-[11px] text-white/30 hover:text-white/55 mb-4 text-right transition-colors"
            >
              ← חזור
            </button>
            <p className="text-sm font-black text-white text-center mb-1 shrink-0">בחר תבנית</p>
            <p className="text-[11px] text-white/40 text-center mb-4 shrink-0 truncate px-4">
              {ex.name} · {sets}×{reps}{weight > 0 ? ` · ${weight}ק"ג` : ""}
            </p>
            <div className="space-y-2 overflow-y-auto flex-1 mb-3">
              {userTemplates.length === 0 && (
                <p className="text-xs text-white/25 text-center py-6">אין תבניות עדיין</p>
              )}
              {userTemplates.map((t: any) => (
                <button
                  key={t.id}
                  onClick={() => handleAddToTemplate(t)}
                  className="w-full text-right p-3.5 rounded-2xl bg-white/6 border border-white/8 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{t.name}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">
                      {(t.exercises ?? []).length} תרגילים
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-white/40 shrink-0" />
                </button>
              ))}
            </div>
            <button
              onClick={handleCreateTemplate}
              className="w-full p-3.5 rounded-2xl border border-dashed border-white/15 text-xs text-white/40 hover:border-white/30 hover:text-white/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> צור תבנית חדשה
            </button>
          </div>
        )}

        {/* ── SS CHOICE step ─────────────────────────────────────── */}
        {step === "ss_choice" && (
          <div>
            <div className="text-center mb-6">
              <p className="text-base font-black text-white">Super Set עם "{ex.name}"</p>
              <p className="text-[11px] text-white/40 mt-1">איך תרצה להוסיף את התרגיל השני?</p>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => { onConfirmSSFromLibrary?.(ex); onClose(); }}
                className="w-full py-4 rounded-2xl bg-purple-500 text-white text-sm font-black active:scale-[0.97] transition-all shadow-[0_0_20px_rgba(139,92,246,0.35)] flex items-center justify-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                בחר תרגיל שני מהספרייה
              </button>
              <button
                onClick={() => { onConfirmSS?.(ex); onClose(); }}
                className="w-full py-3.5 rounded-2xl border border-white/15 text-white/60 text-sm font-bold active:scale-[0.97] transition-all hover:bg-white/5"
              >
                הוסף ידנית בבנאי
              </button>
            </div>
            <button
              onClick={() => setStep("main")}
              className="w-full mt-3 py-2 text-[11px] text-white/30 hover:text-white/50 transition-colors"
            >
              ← חזור
            </button>
          </div>
        )}
      </div>
    </>
  );
}
