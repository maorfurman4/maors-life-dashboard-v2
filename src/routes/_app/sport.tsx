import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, Flame } from "lucide-react";
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
import { SportCategoryZones } from "@/components/sport/SportCategoryZones";
import { WeightTracker } from "@/components/health/WeightTracker";
import { BodyProgressGallery } from "@/components/health/BodyProgressGallery";

export const Route = createFileRoute("/_app/sport")({
  component: SportPage,
});

type Tab = "dashboard" | "workouts" | "library" | "progress" | "body";

const tabs: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "דשבורד" },
  { key: "workouts", label: "אימונים" },
  { key: "library", label: "ספרייה" },
  { key: "progress", label: "התקדמות" },
  { key: "body", label: "גוף" },
];

function SportPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-sport/15 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,135,0.15)]">
          <Dumbbell className="h-5 w-5 text-sport" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">ספורט ובריאות</h2>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Flame className="h-3 w-3 text-sport" />
            <span>התחל להוסיף אימונים</span>
          </div>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-secondary/30 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[40px] ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-5">
          <SportDashboardKPIs />
          <SportWeeklyProgress />
          <SportQuickAdd />
          <SportCategoryZones />
        </div>
      )}

      {activeTab === "workouts" && (
        <div className="space-y-5">
          <SportQuickAdd />
          <SportWeeklyPlan />
          <SportAIPlanner />
          <SportWorkoutTemplates />
          <SportWorkoutCards />
        </div>
      )}

      {activeTab === "library" && (
        <div className="space-y-5">
          <ExerciseLibrary />
        </div>
      )}

      {activeTab === "progress" && (
        <div className="space-y-5">
          <SportProgressCharts />
          <SportPRTracking />
        </div>
      )}

      {activeTab === "body" && (
        <div className="space-y-5">
          <WeightTracker />
          <BodyProgressGallery />
        </div>
      )}
    </div>
  );
}
