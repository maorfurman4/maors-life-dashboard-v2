import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Camera, PenLine, Dumbbell, Droplets,
  X, Plus, UtensilsCrossed, Loader2,
} from "lucide-react";
import {
  useNutritionEntries, useUserSettings, useWaterEntry,
  useAddWaterMl,
} from "@/hooks/use-sport-data";
import { AddMealDrawer } from "@/components/nutrition/AddMealDrawer";
import { NutritionPlannerTab } from "@/components/nutrition/NutritionPlannerTab";
import { NutritionJournalTab } from "@/components/nutrition/NutritionJournalTab";
import { NutritionCulinaryTab } from "@/components/nutrition/NutritionCulinaryTab";
import { recognizeMeal } from "@/lib/ai-service";
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
// Two distinct flows: AI Vision (camera/gallery) vs Manual entry
function QuickAddFAB({
  onManual,
  onAIVision,
}: {
  onManual: () => void;
  onAIVision: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const options = [
    {
      icon: Camera,  label: "זיהוי AI מתמונה", color: "#a855f7",
      action: () => { onAIVision(); setExpanded(false); },
    },
    {
      icon: PenLine, label: "הזנה ידנית",       color: "#10b981",
      action: () => { onManual();   setExpanded(false); },
    },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2.5">
      {expanded && (
        <div className="flex flex-col items-center gap-2 mb-1">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={opt.action}
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

      <button
        onClick={() => setExpanded((v) => !v)}
        className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          expanded
            ? "bg-white/15 backdrop-blur-xl border border-white/25 rotate-45"
            : "bg-emerald-500 hover:bg-emerald-400 active:scale-95"
        }`}
      >
        {expanded ? <X className="h-6 w-6 text-white" /> : <Plus className="h-7 w-7 text-white" />}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function NutritionPage() {
  const [activeTab,   setActiveTab]   = useState<Tab>("dashboard");
  const [isTraining,  setIsTraining]  = useState(false);
  const [addMealOpen, setAddMealOpen] = useState(false);

  // ── AI Vision state ──
  const aiFileRef                     = useRef<HTMLInputElement>(null);
  const [aiScanning, setAiScanning]   = useState(false);
  const [prefill, setPrefill]         = useState<{
    name?: string; calories?: number; protein?: number; carbs?: number; fat?: number;
  }>({});

  // ── Data hooks ──
  const { data: meals    } = useNutritionEntries();
  const { data: settings } = useUserSettings();
  const { data: waterEntry } = useWaterEntry();
  const addWaterMl = useAddWaterMl();

  // ── Macro totals ──
  const totalCal  = (meals ?? []).reduce((s, m) => s + (m.calories        ?? 0), 0);
  const totalProt = (meals ?? []).reduce((s, m) => s + (Number(m.protein_g) || 0), 0);
  const totalCarb = (meals ?? []).reduce((s, m) => s + (Number(m.carbs_g)   || 0), 0);
  const totalFat  = (meals ?? []).reduce((s, m) => s + (Number(m.fat_g)     || 0), 0);

  // ── Water: glasses field now stores ml directly ──
  const totalWaterMl = waterEntry?.glasses ?? 0;

  // ── Goals — switch on training day ──
  const s = settings as any;
  const calGoal   = isTraining ? (s?.training_day_calories ?? 2400) : (s?.daily_calories_goal  ?? 2000);
  const protGoal  = isTraining ? (s?.training_day_protein  ?? 160)  : (s?.daily_protein_goal   ?? 120);
  const carbGoal  = s?.daily_carbs_goal ?? 250;
  const fatGoal   = s?.daily_fat_goal   ?? 65;
  const waterGoal = s?.daily_water_ml   ?? 2500;

  // ── Water quick-add ──
  const handleAddWater = (ml: number) => {
    addWaterMl.mutate(
      { addMl: ml, currentMl: totalWaterMl },
      { onError: (e) => toast.error("שגיאה: " + (e as Error).message) }
    );
  };

  // ── AI Vision flow: file → recognizeMeal → prefill AddMealDrawer ──
  const handleAIFile = async (file: File) => {
    setAiScanning(true);
    try {
      const reader = new FileReader();
      const b64 = await new Promise<string>((res, rej) => {
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const result = await recognizeMeal(b64);
      setPrefill({
        name:     result.name,
        calories: Math.round(result.calories),
        protein:  Math.round(result.protein_g),
        carbs:    Math.round(result.carbs_g ?? 0),
        fat:      Math.round(result.fat_g   ?? 0),
      });
      setAddMealOpen(true);
      toast.success(`זוהה: ${result.name}`);
    } catch {
      toast.error("לא הצלחתי לזהות — נסה תמונה ברורה יותר");
    } finally {
      setAiScanning(false);
    }
  };

  return (
    <>
      {/* ── Page wrapper: background image lives HERE, not in fixed divs ── */}
      {/* z-index: -2 was hidden behind body bg-color. Now the wrapper      */}
      {/* itself paints the image, directly over the body background.        */}
      <div
        dir="rtl"
        className="-mx-3 md:-mx-6 -mt-3 md:-mt-6 relative bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2000&auto=format&fit=crop')`,
          minHeight: '100vh',
        }}
      >
        {/* ── Dark overlay — absolute, sits over the image ── */}
        <div className="absolute inset-0 bg-[#080b12]/42 pointer-events-none" />

        {/* ── All content — relative z-10 so it's above the overlay ── */}
        <div className="relative z-10 pb-32">


        {/* ── Glass tab bar — sticky ── */}
        <div className="relative z-10 px-4 py-2 bg-black/25 backdrop-blur-xl">
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
          <div className="px-4 pt-16 space-y-4">

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
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">מים</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-cyan-400">
                    {(totalWaterMl / 1000).toFixed(2)}L
                  </span>
                  <span className="text-[10px] text-white/30">
                    / {(waterGoal / 1000).toFixed(1)}L
                  </span>
                  {totalWaterMl > 0 && (
                    <button
                      onClick={() => addWaterMl.mutate({ addMl: -totalWaterMl, currentMl: totalWaterMl })}
                      className="text-[9px] text-white/20 hover:text-rose-400 transition-colors"
                    >
                      איפוס
                    </button>
                  )}
                </div>
              </div>

              {/* Segmented progress bar */}
              <div className="relative w-full h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min((totalWaterMl / waterGoal) * 100, 100)}%` }}
                />
                {/* droplet markers every 500ml */}
                <div className="absolute inset-0 flex">
                  {Array.from({ length: Math.floor(waterGoal / 500) }, (_, i) => (
                    <div key={i} className="flex-1 border-r border-white/10 last:border-0" />
                  ))}
                </div>
              </div>

              {/* Quick-add buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "+500ml", ml: 500  },
                  { label: "+750ml", ml: 750  },
                  { label: "+1.5L",  ml: 1500 },
                ].map(({ label, ml }) => (
                  <button
                    key={ml}
                    onClick={() => handleAddWater(ml)}
                    disabled={addWaterMl.isPending}
                    className="py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 active:scale-95 transition-all disabled:opacity-40"
                  >
                    {label}
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
          <NutritionPlannerTab />
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3 — JOURNAL  (Phase 3)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "journal" && (
          <NutritionJournalTab />
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4 — CULINARY AI  (Phase 3)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "culinary" && (
          <NutritionCulinaryTab />
        )}

        </div>{/* end: relative z-10 content */}
      </div>{/* end: bg wrapper */}

      {/* ── AI Vision hidden file input ── */}
      <input
        ref={aiFileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleAIFile(f);
          e.target.value = "";
        }}
      />

      {/* ── AI scanning overlay ── */}
      {aiScanning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-purple-400 animate-spin" />
            <p className="text-white font-bold text-sm">מזהה ארוחה עם AI...</p>
          </div>
        </div>
      )}

      {/* ── FAB — Tab 1 only ── */}
      {activeTab === "dashboard" && (
        <QuickAddFAB
          onManual={() => { setPrefill({}); setAddMealOpen(true); }}
          onAIVision={() => aiFileRef.current?.click()}
        />
      )}

      {/* ── Drawers ── */}
      <AddMealDrawer
        open={addMealOpen}
        onClose={() => { setAddMealOpen(false); setPrefill({}); }}
        prefillName={prefill.name}
        prefillCalories={prefill.calories}
        prefillProtein={prefill.protein}
        prefillCarbs={prefill.carbs}
        prefillFat={prefill.fat}
      />

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
