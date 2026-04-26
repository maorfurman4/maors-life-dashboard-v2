import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  Dumbbell, Play, CheckCircle2, Trophy, Flame, Clock,
  Target, Zap, ChevronRight, Plus, RotateCcw,
} from "lucide-react";
import { usePersonalRecords } from "@/hooks/use-sport-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/sport")({
  component: SportPage,
});

// ─── types ───────────────────────────────────────────────────────────────────
type Tab = "dashboard" | "builder" | "library" | "progress";

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "בית"        },
  { key: "builder",   label: "אימונים"    },
  { key: "library",   label: "ספרייה"     },
  { key: "progress",  label: "התקדמות"    },
];

// ─── Quick-Add workout definitions ───────────────────────────────────────────
const QUICK_WORKOUTS = [
  {
    key: "cardio",
    label: "ריצה / קרדיו",
    emoji: "🏃",
    color: "#f97316",
    image: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&q=80",
    durations: [20, 30, 45],
  },
  {
    key: "strength",
    label: "כוח",
    emoji: "🏋️",
    color: "#10b981",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
    durations: [45, 60, 75],
  },
  {
    key: "hiit",
    label: "HIIT",
    emoji: "⚡",
    color: "#eab308",
    image: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400&q=80",
    durations: [15, 20, 30],
  },
  {
    key: "chest",
    label: "חזה / כתפיים",
    emoji: "💪",
    color: "#3b82f6",
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80",
    durations: [45, 60, 75],
  },
  {
    key: "back",
    label: "גב / מתח",
    emoji: "🦾",
    color: "#8b5cf6",
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80",
    durations: [45, 60, 75],
  },
  {
    key: "legs",
    label: "רגליים",
    emoji: "🦵",
    color: "#ec4899",
    image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80",
    durations: [50, 60, 80],
  },
  {
    key: "core",
    label: "ליבה / בטן",
    emoji: "🎯",
    color: "#06b6d4",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80",
    durations: [15, 25, 40],
  },
  {
    key: "yoga",
    label: "יוגה / גמישות",
    emoji: "🧘",
    color: "#a78bfa",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80",
    durations: [20, 45, 60],
  },
] as const;

// ─── Weekly day strip ─────────────────────────────────────────────────────────
const DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const TODAY_IDX = new Date().getDay(); // 0 = Sun
const TODAY_NAME = new Date().toLocaleDateString("he-IL", { weekday: "long" });

// ─── Today's workout (static placeholder until AI planner wired) ──────────────
const TODAY_PLAN = {
  name:     "כוח עליון — חזה וכתפיים",
  duration: 60,
  exercises: [
    { name: "לחיצת חזה",     sets: 4, reps: "8"     },
    { name: "לחיצת כתפיים",  sets: 3, reps: "10"    },
    { name: "פרפר",          sets: 3, reps: "12"    },
    { name: "מקבילים",       sets: 3, reps: "10-12" },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Training-day / rest-day status banner */
function DayStatusBanner({
  isTraining, onToggle,
}: {
  isTraining: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-xl transition-all duration-300 text-right ${
        isTraining
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
        isTraining ? "bg-emerald-500/25" : "bg-white/10"
      }`}>
        {isTraining
          ? <Flame className="h-5 w-5 text-emerald-400" />
          : <RotateCcw className="h-5 w-5 text-white/40" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-white leading-tight">
          {isTraining ? "🔥 יום אימון" : "😴 יום מנוחה"}
        </p>
        <p className="text-[11px] text-white/40 mt-0.5">
          {isTraining ? "כל הכבוד — לכו על זה!" : "מנוחה = התאוששות = גדילה"}
        </p>
      </div>
      <div className={`relative w-12 h-6 rounded-full shrink-0 transition-colors duration-300 ${
        isTraining ? "bg-emerald-500" : "bg-white/15"
      }`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
          isTraining ? "translate-x-6" : "translate-x-0.5"
        }`} />
      </div>
    </button>
  );
}

/** Single image-backed Quick Add card */
function QuickWorkoutCard({
  workout,
  onQuickLog,
}: {
  workout: (typeof QUICK_WORKOUTS)[number];
  onQuickLog: (label: string, duration: number) => void;
}) {
  const [selDuration, setSelDuration] = useState(workout.durations[1]);

  return (
    <div
      className="relative flex-shrink-0 w-36 h-48 rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{
        backgroundImage: `url('${workout.image}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Gradient overlay — bottom heavy so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

      {/* Emoji badge top-right */}
      <span className="absolute top-2.5 right-2.5 text-2xl leading-none drop-shadow-lg">
        {workout.emoji}
      </span>

      {/* Name */}
      <p className="absolute bottom-16 right-0 left-0 px-3 text-sm font-black text-white leading-tight text-right">
        {workout.label}
      </p>

      {/* Duration selector chips */}
      <div className="absolute bottom-8 left-0 right-0 flex gap-1 px-2.5 justify-end">
        {workout.durations.map((d) => (
          <button
            key={d}
            onClick={(e) => { e.stopPropagation(); setSelDuration(d); }}
            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-all ${
              selDuration === d
                ? "text-white border"
                : "text-white/50"
            }`}
            style={selDuration === d ? { borderColor: workout.color, color: workout.color, background: workout.color + "28" } : {}}
          >
            {d}′
          </button>
        ))}
      </div>

      {/* Log button */}
      <button
        onClick={() => onQuickLog(workout.label, selDuration)}
        className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-black text-white transition-all active:scale-95"
        style={{ background: workout.color + "cc", backdropFilter: "blur(8px)" }}
      >
        <Plus className="h-3 w-3" />
        הוסף
      </button>
    </div>
  );
}

/** Horizontal scrollable Quick Add row */
function QuickAddRow() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleQuickLog = (label: string, duration: number) => {
    toast.success(`✅ ${label} — ${duration} דקות נרשם!`, { duration: 2500 });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <p className="text-sm font-black text-white">הוסף מהיר</p>
        <button className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors">
          <span>כל האימונים</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-0.5 px-0.5"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {QUICK_WORKOUTS.map((w) => (
          <div key={w.key} style={{ scrollSnapAlign: "start" }}>
            <QuickWorkoutCard workout={w} onQuickLog={handleQuickLog} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Today's plan card */
function TodayPlanCard({ isTraining }: { isTraining: boolean }) {
  const [started, setStarted] = useState(false);

  if (!isTraining) {
    return (
      <div className="rounded-3xl border border-white/8 bg-white/3 backdrop-blur-xl p-5 text-center space-y-2">
        <span className="text-4xl">🌙</span>
        <p className="text-sm font-black text-white/60">יום מנוחה</p>
        <p className="text-[11px] text-white/30">מתאושש היום — האימון הבא מחר</p>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border backdrop-blur-xl p-5 space-y-4 transition-all ${
      started ? "border-emerald-500/40 bg-emerald-500/8" : "border-white/10 bg-white/5"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/25 flex items-center justify-center">
            <Dumbbell className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white">{TODAY_PLAN.name}</p>
            <p className="text-[11px] text-white/40">{TODAY_NAME}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-white/40">
          <Clock className="h-3.5 w-3.5" />
          {TODAY_PLAN.duration} דק׳
        </div>
      </div>

      {/* Exercise list */}
      <div className="rounded-2xl bg-white/4 border border-white/8 divide-y divide-white/5">
        {TODAY_PLAN.exercises.map((ex) => (
          <div key={ex.name} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs font-semibold text-white/80">{ex.name}</span>
            <span className="text-[10px] text-white/40 font-mono">{ex.sets}×{ex.reps}</span>
          </div>
        ))}
      </div>

      {!started ? (
        <button
          onClick={() => setStarted(true)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-emerald-500 text-white font-black text-sm min-h-[48px] hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(16,185,129,0.35)]"
        >
          <Play className="h-4 w-4" />
          התחל אימון
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-black">האימון רץ — כל הכבוד! 💪</span>
        </div>
      )}
    </div>
  );
}

/** KPI stats strip */
function StatsStrip() {
  const { data: prs } = usePersonalRecords();
  const prCount = (prs ?? []).length;

  const stats = [
    { label: "אימונים", value: "0", sub: "השבוע", icon: Target, color: "#10b981" },
    { label: "דקות",    value: "0", sub: "השבוע",  icon: Clock,  color: "#3b82f6" },
    { label: "שיאים",   value: String(prCount), sub: "סה״כ",  icon: Trophy, color: "#f59e0b" },
    { label: "קלוריות", value: "0", sub: "אתמול",  icon: Flame,  color: "#ef4444" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map(({ label, value, sub, icon: Icon, color }) => (
        <div
          key={label}
          className="rounded-2xl border border-white/8 bg-white/5 backdrop-blur-xl p-3 text-center space-y-1.5"
        >
          <div
            className="h-7 w-7 rounded-xl mx-auto flex items-center justify-center"
            style={{ background: color + "22" }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color }} />
          </div>
          <p className="text-lg font-black text-white leading-none">{value}</p>
          <p className="text-[9px] text-white/35 font-medium">{label}</p>
          <p className="text-[8px] text-white/20">{sub}</p>
        </div>
      ))}
    </div>
  );
}

/** Weekly dot strip */
function WeekStrip() {
  const completedDays: number[] = [];
  const done  = completedDays.length;
  const goal  = 3;
  const pct   = Math.min(100, (done / goal) * 100);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-400" />
          <p className="text-sm font-black text-white">שבוע אימונים</p>
        </div>
        <span className="text-[11px] font-semibold text-white/40">{done}/{goal} אימונים</span>
      </div>

      {/* Bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-700 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Day circles */}
      <div className="flex justify-between">
        {DAYS.map((day, i) => {
          const isToday    = i === TODAY_IDX;
          const completed  = completedDays.includes(i);
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                completed
                  ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  : isToday
                  ? "border-2 border-emerald-500/60 text-emerald-400 bg-emerald-500/10"
                  : "border border-white/10 text-white/20"
              }`}>
                {completed ? "✓" : day}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Stub for tabs not yet built */
function ComingSoon({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="px-4 pt-20 flex flex-col items-center gap-4 text-center">
      <span className="text-7xl">{emoji}</span>
      <p className="text-white/80 font-black text-xl">{title}</p>
      <div className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <p className="text-white/40 text-sm">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function SportPage() {
  const [activeTab,  setActiveTab]  = useState<Tab>("dashboard");
  const [isTraining, setIsTraining] = useState(true);

  return (
    <>
      {/* ── Immersive gym background ─────────────────────────────────────── */}
      {/*  Same proven pattern as Nutrition: bg-image on wrapper div itself,  */}
      {/*  not fixed divs (which disappear behind body bg-color).             */}
      <div
        dir="rtl"
        className="-mx-3 md:-mx-6 -mt-3 md:-mt-6 relative bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2000&auto=format&fit=crop')`,
          minHeight: "100vh",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/78 pointer-events-none" />

        {/* Ambient sport glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-500/15 blur-[120px]" />
          <div className="absolute bottom-40 -left-16 h-60 w-60 rounded-full bg-blue-500/10 blur-[100px]" />
        </div>

        {/* ── All content ── */}
        <div className="relative z-10 pb-32">

          {/* ── Header ── */}
          <div className="px-4 pt-5 pb-3 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <Dumbbell className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">ספורט 💪</h1>
              <p className="text-[11px] text-white/40 mt-0.5">עקוב · תכנן · השתפר</p>
            </div>
          </div>

          {/* ── Sticky Tab Bar ── */}
          <div className="sticky top-0 z-20 px-4 py-2 bg-black/60 backdrop-blur-xl">
            <div className="flex gap-1 p-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                    activeTab === t.key
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 — DASHBOARD
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div className="px-4 pt-4 space-y-5">

              {/* Training / Rest toggle */}
              <DayStatusBanner
                isTraining={isTraining}
                onToggle={() => setIsTraining((v) => !v)}
              />

              {/* ── Quick Add Cards (horizontal scroll) ── */}
              <QuickAddRow />

              {/* ── Today's Plan ── */}
              <div className="space-y-2">
                <p className="text-sm font-black text-white">אימון היום</p>
                <TodayPlanCard isTraining={isTraining} />
              </div>

              {/* ── KPI Stats ── */}
              <StatsStrip />

              {/* ── Weekly Progress ── */}
              <WeekStrip />

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 — BUILDER / AI PLANNER  (Phase 2)
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "builder" && (
            <ComingSoon
              emoji="🤖"
              title="בונה אימונים + AI Coach"
              subtitle="תכנון שבועי · בחירה חכמה של סטים/חזרות — Phase 2"
            />
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3 — EXERCISE LIBRARY  (Phase 3)
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "library" && (
            <ComingSoon
              emoji="📚"
              title="ספריית תרגילים"
              subtitle="לפי קבוצת שריר · צורת ביצוע · וידאו — Phase 3"
            />
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4 — PROGRESS & BODY  (Phase 3)
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "progress" && (
            <ComingSoon
              emoji="📈"
              title="התקדמות וגוף"
              subtitle="גרפים · שיאים · גלריית טרנספורמציה — Phase 3"
            />
          )}

        </div>
      </div>

      {/* ── keyframe for future use ── */}
      <style>{`
        @keyframes sportPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </>
  );
}
