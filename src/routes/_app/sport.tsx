import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import { useState } from "react";
import { SportDashboardKPIs } from "@/components/sport/SportDashboardKPIs";
import { SportWeeklyProgress } from "@/components/sport/SportWeeklyProgress";
import { SportQuickAdd } from "@/components/sport/SportQuickAdd";
import { SportWorkoutCards } from "@/components/sport/SportWorkoutCards";
import { SportPRTracking } from "@/components/sport/SportPRTracking";
import { SportProgressCharts } from "@/components/sport/SportProgressCharts";
import { SportWorkoutTemplates } from "@/components/sport/SportWorkoutTemplates";
import { SportAIPlanner } from "@/components/sport/SportAIPlanner";
import { SportWeeklyPlan } from "@/components/sport/SportWeeklyPlan";
import { ExerciseLibrary } from "@/components/sport/ExerciseLibrary";
import { WeightTracker } from "@/components/health/WeightTracker";
import { BodyProgressGallery } from "@/components/health/BodyProgressGallery";
import { SportFunFact } from "@/components/sport/SportFunFact";
import { SportAIConsultant } from "@/components/sport/SportAIConsultant";
import { SportDailyWorkout } from "@/components/sport/SportDailyWorkout";
import { SportProgressSummary } from "@/components/sport/SportProgressSummary";
import { WearableStub } from "@/components/sport/WearableStub";

export const Route = createFileRoute("/_app/sport")({
  component: SportPage,
});

const BG_IMAGE =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1400&q=80";

type Tab = "dashboard" | "workouts" | "library" | "progress" | "body" | "ai";

const tabs: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "בית" },
  { key: "workouts", label: "אימונים" },
  { key: "library", label: "ספרייה" },
  { key: "progress", label: "התקדמות" },
  { key: "body", label: "גוף" },
  { key: "ai", label: "AI" },
];

function SportPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div
      className="-mx-3 -mt-3 md:-mx-6 md:-mt-6 relative min-h-screen px-4 pt-8 pb-28 md:px-8"
      style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center top" }}
      dir="rtl"
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65 pointer-events-none" />

      {/* Sport ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-sport/20 blur-[100px]" />
        <div className="absolute bottom-32 -right-16 h-56 w-56 rounded-full bg-sport/10 blur-[80px]" />
      </div>

      <div className="relative space-y-5 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-sport/20 backdrop-blur-md border border-sport/30 flex items-center justify-center shadow-[0_0_24px_rgba(0,255,135,0.2)]">
            <Dumbbell className="h-5 w-5 text-sport" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">בית הספורט</h2>
            <p className="text-xs text-white/40 font-medium">עקוב, תכנן, השתפר</p>
          </div>
        </div>

        {/* Glass tab bar */}
        <div className="flex gap-1 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all min-h-[38px] whitespace-nowrap px-2 ${
                activeTab === tab.key
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <SportFunFact />
            <SportDailyWorkout />
            <SportDashboardKPIs />
            <SportWeeklyProgress />
            <SportProgressSummary />
          </div>
        )}

        {/* Workouts */}
        {activeTab === "workouts" && (
          <div className="space-y-5">
            <SportQuickAdd />
            <SportWeeklyPlan />
            <SportAIPlanner />
            <SportWorkoutTemplates />
            <SportWorkoutCards />
          </div>
        )}

        {/* Library */}
        {activeTab === "library" && (
          <div className="space-y-5">
            <ExerciseLibrary />
          </div>
        )}

        {/* Progress */}
        {activeTab === "progress" && (
          <div className="space-y-5">
            <SportProgressCharts />
            <SportPRTracking />
            <WearableStub />
          </div>
        )}

        {/* Body */}
        {activeTab === "body" && (
          <div className="space-y-5">
            <WeightTracker />
            <BodyProgressGallery />
          </div>
        )}

        {/* AI */}
        {activeTab === "ai" && (
          <div className="space-y-5">
            <SportAIConsultant />
            <SportAIPlanner />
          </div>
        )}
      </div>
    </div>
  );
}
