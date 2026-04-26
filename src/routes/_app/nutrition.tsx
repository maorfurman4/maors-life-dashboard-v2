import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Camera, PenLine, Image as ImageIcon,
  Dumbbell, Droplets, X, Plus, UtensilsCrossed,
} from "lucide-react";
import { useNutritionEntries, useUserSettings, useWaterEntry, useUpsertWater } from "@/hooks/use-sport-data";
import { AddMealDrawer } from "@/components/nutrition/AddMealDrawer";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/nutrition")({
  component: NutritionPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "dashboard" | "planner" | "journal" | "culinary";

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "מסך ראשי"  },
  { key: "planner",   label: "מחשבון AI" },
  { key: "journal",   label: "היסטוריה"  },
  { key: "culinary",  label: "מתכונים"   },
];

// ─── SVG Ring ─────────────────────────────────────────────────────────────────
function Ring({
  value, max, color, size, stroke, children,
}: {
  value: number; max: number; color: string;
  size: number; stroke: number; children: React.ReactNode;
}) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = max > 0 ? Math.min(value / max, 1) : 0;
  const dash = pct * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* track */}
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        {/* progress */}
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.7s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        {children}
      </div>
    </div>
  );
}

// ─── Training Toggle ──────────────────────────────────────────────────────────
function TrainingToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-xl transition-all duration-300 text-right ${
        active
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      {/* Icon */}
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
        active ? "bg-emerald-500/25" : "bg-white/10"
      }`}>
        <Dumbbell className={`h-4 w-4 ${active ? "text-emerald-400" : "text-white/50"}`} />
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">
          {active ? "🔥 יום אימון" : "יום מנוחה"}
        </p>
        <p className="text-[11px] text-white/40 mt-0.5">
          {active ? "יעדים מוגברים פעילים" : "הפעל ליום אימון"}
        </p>
      </div>

      {/* Toggle pill */}
      <div className={`relative w-12 h-6 rounded-full shrink-0 transition-colors duration-300 ${
        active ? "bg-emerald-500" : "bg-white/15"
      }`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
          active ? "translate-x-6" : "translate-x-0.5"
        }`} />
      </div>
    </button>
  );
}

// ─── Floating Action Button ───────────────────────────────────────────────────
function QuickAddFAB({ onManual }: { onManual: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const options = [
    { icon: Camera,    label: "זיהוי מצלמה / AI", color: "#a855f7" },
    { icon: PenLine,   label: "הזנה ידנית",        color: "#10b981" },
    { icon: ImageIcon, label: "העלה מגלריה",       color: "#3b82f6" },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2.5">
      {/* Expanded options */}
      {expanded && (
        <div className="flex flex-col items-center gap-2 mb-1">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => { onManual(); setExpanded(false); }}
              className="flex items-center gap-3 px-5 py-2.5 rounded-2xl text-white text-sm font-bold shadow-2xl backdrop-blur-xl border border-white/15"
              style={{
                background: opt.color + "e0",
                animation: `fabSlideUp 0.18s ease ${i * 45}ms both`,
              }}
            >
              <opt.icon className="h-4 w-4" />
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          expanded
            ? "bg-white/15 backdrop-blur-xl border border-white/25 rotate-45"
            : "bg-emerald-500 hover:bg-emerald-400 active:scale-95"
        }`}
      >
        {expanded
          ? <X    className="h-6 w-6 text-white" />
          : <Plus className="h-7 w-7 text-white" />}
      </button>
    </div>
  );
}

// ─── Placeholder for future phases ───────────────────────────────────────────
function ComingSoon({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="px-4 pt-16 flex flex-col items-center gap-4 text-center">
      <span className="text-7xl">{emoji}</span>
      <p className="text-white/80 font-black text-xl">{title}</p>
      <div className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <p className="text-white/40 text-sm">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function NutritionPage() {
  const [activeTab,   setActiveTab]   = useState<Tab>("dashboard");
  const [isTraining,  setIsTraining]  = useState(false);
  const [addMealOpen, setAddMealOpen] = useState(false);

  // ── Data hooks ──
  const { data: meals    } = useNutritionEntries();
  const { data: settings } = useUserSettings();
  const { data: waterEntry } = useWaterEntry();
  const upsertWater = useUpsertWater();

  // ── Macro totals from today's meals ──
  const totalCal  = (meals ?? []).reduce((s, m) => s + (m.calories        ?? 0), 0);
  const totalProt = (meals ?? []).reduce((s, m) => s + (Number(m.protein_g) || 0), 0);
  const totalCarb = (meals ?? []).reduce((s, m) => s + (Number(m.carbs_g)   || 0), 0);
  const totalFat  = (meals ?? []).reduce((s, m) => s + (Number(m.fat_g)     || 0), 0);
  const glasses   = waterEntry?.glasses ?? 0;
  const totalWaterMl = glasses * 250;

  // ── Goals — switch on training day ──
  const s = settings as any;
  const calGoal   = isTraining ? (s?.training_day_calories ?? 2400) : (s?.daily_calories_goal  ?? 2000);
  const protGoal  = isTraining ? (s?.training_day_protein  ?? 160)  : (s?.daily_protein_goal   ?? 120);
  const carbGoal  = s?.daily_carbs_goal ?? 250;
  const fatGoal   = s?.daily_fat_goal   ?? 65;
  const waterGoal = s?.daily_water_ml   ?? 2500;

  // ── Water glass click ──
  const handleGlass = (g: number) => {
    const next = glasses === g ? g - 1 : g;
    upsertWater.mutate(
      { glasses: Math.max(0, next) },
      { onError: (e) => toast.error("שגיאה: " + (e as Error).message) }
    );
  };

  return (
    <>
      {/* ── Full-screen food background ─────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          zIndex: -2,
          backgroundImage: `url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1400&auto=format&fit=crop&q=80')`,
        }}
      />
      {/* Deep dark overlay */}
      <div className="fixed inset-0 bg-[#080b12]/82" style={{ zIndex: -1 }} />

      {/* ── Page wrapper — bleeds out of main's p-3/p-6 padding ─────────── */}
      <div className="-mx-3 md:-mx-6 -mt-3 md:-mt-6 pb-32" dir="rtl">

        {/* ── Page header ── */}
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-2xl font-black text-white tracking-tight">תזונה חכמה 🥗</h1>
          <p className="text-[11px] text-white/40 mt-0.5">מבוסס מדע · מסונכרן עם ספורט</p>
        </div>

        {/* ── Glass tab bar — sticky ── */}
        <div className="sticky top-0 z-20 px-4 py-2 bg-[#080b12]/40 backdrop-blur-lg">
          <div className="flex gap-1 p-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                  activeTab === t.key
                    ? "bg-emerald-500 text-white shadow-lg"
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
          <div className="px-4 pt-4 space-y-4">

            {/* Training Day Toggle */}
            <TrainingToggle
              active={isTraining}
              onToggle={() => setIsTraining((v) => !v)}
            />

            {/* ── Main Macro Glass Panel ── */}
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <p className="text-[10px] font-bold text-white/40 text-center mb-5 uppercase tracking-widest">
                יעד יומי
              </p>

              {/* Primary — large Calories ring */}
              <div className="flex justify-center mb-6">
                <div className="flex flex-col items-center gap-2">
                  <Ring value={totalCal} max={calGoal} color="#10b981" size={170} stroke={14}>
                    <span className="text-3xl font-black text-white leading-none">
                      {Math.round(totalCal).toLocaleString("he")}
                    </span>
                    <span className="text-[10px] text-white/40">
                      / {calGoal.toLocaleString("he")} קל׳
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 mt-0.5">
                      {calGoal > 0 ? Math.round((totalCal / calGoal) * 100) : 0}%
                    </span>
                  </Ring>
                  <p className="text-xs font-bold text-white/60">קלוריות</p>
                </div>
              </div>

              {/* Secondary — Protein / Carbs / Fat */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: totalProt, max: protGoal, label: "חלבון",   unit: "g", color: "#3b82f6" },
                  { value: totalCarb, max: carbGoal, label: "פחמימות", unit: "g", color: "#f59e0b" },
                  { value: totalFat,  max: fatGoal,  label: "שומן",    unit: "g", color: "#ec4899" },
                ].map((m) => (
                  <div key={m.label} className="flex flex-col items-center gap-1.5">
                    <Ring value={m.value} max={m.max} color={m.color} size={82} stroke={8}>
                      <span className="text-sm font-black text-white">{Math.round(m.value)}</span>
                      <span className="text-[8px] text-white/40">{m.unit}</span>
                    </Ring>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold text-white/70">{m.label}</p>
                      <p className="text-[9px] text-white/30">מ-{m.max}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Water Tracker ── */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">מים</span>
                </div>
                <span className="text-[11px] text-white/40">
                  {totalWaterMl.toLocaleString("he")}ml / {waterGoal.toLocaleString("he")}ml
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min((totalWaterMl / waterGoal) * 100, 100)}%` }}
                />
              </div>

              {/* Clickable glasses */}
              <div className="flex gap-1 justify-center">
                {Array.from({ length: 8 }, (_, i) => i + 1).map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGlass(g)}
                    className={`text-xl transition-all duration-200 active:scale-125 ${
                      g <= glasses ? "opacity-100" : "opacity-20 hover:opacity-40"
                    }`}
                  >
                    💧
                  </button>
                ))}
              </div>
            </div>

            {/* ── Today's Meals ── */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">ארוחות היום</span>
                </div>
                <span className="text-[11px] text-white/30">{meals?.length ?? 0} ארוחות</span>
              </div>

              {!meals || meals.length === 0 ? (
                <p className="text-center text-white/25 text-xs py-3">
                  לחץ + להוסיף ארוחה ראשונה
                </p>
              ) : (
                <div className="divide-y divide-white/5">
                  {meals.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 gap-2">
                      <span className="text-sm text-white/90 font-medium truncate min-w-0">
                        {m.name}
                      </span>
                      <div className="flex gap-2 text-[10px] text-white/40 shrink-0">
                        {m.calories  != null && <span>{m.calories}קל׳</span>}
                        {m.protein_g != null && <span>{m.protein_g}g P</span>}
                      </div>
                    </div>
                  ))}
                  {(meals?.length ?? 0) > 5 && (
                    <p className="text-center text-white/25 text-[10px] pt-2">
                      +{meals!.length - 5} ארוחות נוספות
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2 — AI PLANNER  (Phase 2)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "planner" && (
          <ComingSoon
            emoji="🧬"
            title="מחשבון TDEE & AI Planner"
            subtitle="מחשבון מדעי · בחירת דיאטה · תפריט שבועי — Phase 2"
          />
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3 — JOURNAL  (Phase 3)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "journal" && (
          <ComingSoon
            emoji="📋"
            title="יומן תזונה חזותי"
            subtitle="כרטיסי ארוחות · גרפים · מגמות — Phase 3"
          />
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4 — CULINARY AI  (Phase 3)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "culinary" && (
          <ComingSoon
            emoji="👨‍🍳"
            title="שף AI · סריקת מקרר"
            subtitle="מתכונים מותאמים דיאטה · זיהוי מרכיבים — Phase 3"
          />
        )}

      </div>

      {/* ── FAB — Tab 1 only ── */}
      {activeTab === "dashboard" && (
        <QuickAddFAB onManual={() => setAddMealOpen(true)} />
      )}

      {/* ── Drawers ── */}
      <AddMealDrawer open={addMealOpen} onClose={() => setAddMealOpen(false)} />

      {/* ── FAB keyframe animation ── */}
      <style>{`
        @keyframes fabSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </>
  );
}
