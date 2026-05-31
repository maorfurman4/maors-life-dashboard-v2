import { useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ChevronDown, Youtube, ShieldCheck, Check } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { X } from "lucide-react";
import { EXERCISE_LIBRARY, MUSCLE_LABELS, searchExercises, type MuscleGroup } from "@/lib/exercise-library";
import { haptics } from "@/lib/haptics";

export interface PickedExercise {
  name: string;
  sets: string;
  reps: string;
  weightKg: string;
  youtube_link?: string;
}

interface ExercisePickerSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (exercises: PickedExercise[]) => void;
}

const MUSCLE_OPTIONS: (MuscleGroup | "all")[] = ["all", "chest", "back", "legs", "core", "biceps", "triceps", "glutes", "shoulders", "fullbody"];
const DIFFICULTY_LABEL = { beginner: "מתחיל", intermediate: "בינוני", advanced: "מתקדם" } as const;
const DIFFICULTY_COLOR = {
  beginner: "bg-emerald-400/15 text-emerald-400",
  intermediate: "bg-amber-400/15 text-amber-400",
  advanced: "bg-rose-400/15 text-rose-400",
} as const;

export function ExercisePickerSheet({ open, onClose, onConfirm }: ExercisePickerSheetProps) {
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "all">("all");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const results = useMemo(
    () =>
      searchExercises(query, muscleFilter === "all" ? undefined : muscleFilter, false).filter(
        (ex) => ex.category !== "running"
      ),
    [query, muscleFilter]
  );

  const togglePending = useCallback((id: string) => {
    haptics.tap();
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleConfirm = () => {
    haptics.success();
    const picked = EXERCISE_LIBRARY.filter((ex) => pendingIds.has(ex.id)).map((ex) => ({
      name: ex.name,
      sets: String(ex.defaultSets),
      reps: String(ex.defaultReps),
      weightKg: "",
      youtube_link: ex.youtube_link,
    }));
    onConfirm(picked);
    setPendingIds(new Set());
    setQuery("");
    setMuscleFilter("all");
    setExpandedId(null);
    onClose();
  };

  const handleClose = () => {
    setPendingIds(new Set());
    setQuery("");
    setMuscleFilter("all");
    setExpandedId(null);
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && handleClose()}>
      <DrawerContent className="max-h-[92vh] bg-[#111114] border-t border-white/8 rounded-t-[20px] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <DrawerHeader className="flex items-center justify-between px-5 pb-3 pt-1 flex-shrink-0">
          <DrawerTitle className="text-[17px] font-bold tracking-tight text-white/95">
            בחר תרגילים
          </DrawerTitle>
          <DrawerClose asChild>
            <button
              onClick={handleClose}
              className="h-7 w-7 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/14 transition-colors active:scale-95"
            >
              <X className="h-3.5 w-3.5 text-white/60" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        {/* Search */}
        <div className="px-5 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש תרגיל..."
              className="w-full pe-9 ps-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-sport min-h-[44px]"
            />
          </div>
        </div>

        {/* Muscle filter chips */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {MUSCLE_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setMuscleFilter(m)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors min-h-[32px] ${
                  muscleFilter === m
                    ? "bg-sport/20 text-sport border border-sport/30"
                    : "bg-secondary/30 hover:bg-secondary/50 text-muted-foreground"
                }`}
              >
                {m === "all" ? "הכל" : MUSCLE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise list */}
        <div className="px-5 overflow-y-auto flex-1 space-y-2 pb-4">
          {results.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">לא נמצאו תרגילים</div>
          ) : (
            results.map((ex) => {
              const isSelected = pendingIds.has(ex.id);
              const isExpanded = expandedId === ex.id;
              return (
                <div
                  key={ex.id}
                  className={`rounded-xl border transition-colors ${
                    isSelected
                      ? "border-sport/40 bg-sport/5"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Main row */}
                  <button
                    onClick={() => togglePending(ex.id)}
                    className="w-full text-end p-3 flex items-start gap-3"
                  >
                    {/* Checkbox */}
                    <div
                      className={`shrink-0 mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-sport bg-sport"
                          : "border-border bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-sport-foreground" strokeWidth={3} />}
                    </div>

                    {/* Name + info */}
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-bold leading-tight line-clamp-2">{ex.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5" dir="ltr">{ex.nameEn}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {ex.muscleGroups.slice(0, 2).map((m) => (
                          <span key={m} className="px-1.5 py-0.5 rounded bg-secondary/40 text-[9px] text-muted-foreground">
                            {MUSCLE_LABELS[m]}
                          </span>
                        ))}
                        {ex.shoulderSafe && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-400/10 text-[9px] text-emerald-400 flex items-center gap-0.5">
                            <ShieldCheck className="h-2.5 w-2.5" /> כתף
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Difficulty + expand button */}
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${DIFFICULTY_COLOR[ex.difficulty]}`}>
                        {DIFFICULTY_LABEL[ex.difficulty]}
                      </span>
                      <button
                        onClick={(e) => toggleExpanded(ex.id, e)}
                        className="h-6 w-6 rounded-lg bg-secondary/40 flex items-center justify-center hover:bg-secondary/60 transition-colors"
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </motion.div>
                      </button>
                    </div>
                  </button>

                  {/* Expandable detail */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
                          {/* Sets × Reps suggestion */}
                          <p className="text-[11px] text-muted-foreground">
                            מוצע: {ex.defaultSets} סטים × {ex.defaultReps} חזרות · מנוחה {ex.restSeconds}ש׳
                          </p>

                          {/* Description */}
                          {ex.description && (
                            <p className="text-[11px] text-muted-foreground/80">{ex.description}</p>
                          )}

                          {/* YouTube */}
                          {ex.youtube_link && (
                            <a
                              href={ex.youtube_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/15 text-red-400 text-[11px] font-semibold hover:bg-red-500/25 transition-colors w-fit"
                            >
                              <Youtube className="h-3.5 w-3.5" /> צפה בסרטון הדרכה
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-5 pb-8 pt-3 border-t border-white/6 bg-[#111114] flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={pendingIds.size === 0}
            className="w-full py-3 rounded-xl bg-sport text-sport-foreground font-bold text-sm hover:opacity-90 transition-opacity min-h-[44px] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {pendingIds.size === 0
              ? "בחר תרגילים"
              : `הוסף ${pendingIds.size} תרגיל${pendingIds.size > 1 ? "ים" : ""} לאימון`}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
