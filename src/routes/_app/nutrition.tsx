import { createFileRoute } from "@tanstack/react-router";
import { Apple, Leaf } from "lucide-react";
import { useState } from "react";
import { NutritionDynamicGoals } from "@/components/nutrition/NutritionDynamicGoals";
import { NutritionMacroRings } from "@/components/nutrition/NutritionMacroRings";
import { NutritionMealCards } from "@/components/nutrition/NutritionMealCards";
import { NutritionQuickAdd } from "@/components/nutrition/NutritionQuickAdd";
import { NutritionFavorites } from "@/components/nutrition/NutritionFavorites";
import { NutritionFoodSearch } from "@/components/nutrition/NutritionFoodSearch";
import { NutritionWeightChart } from "@/components/nutrition/NutritionWeightChart";
import { NutritionTDEECalculator } from "@/components/nutrition/NutritionTDEECalculator";
import { WeightTracker } from "@/components/health/WeightTracker";
import { NutritionPhotoAnalyzer } from "@/components/nutrition/NutritionPhotoAnalyzer";
import { NutritionRecipeGenerator } from "@/components/nutrition/NutritionRecipeGenerator";
import { NutritionFoodLabels } from "@/components/nutrition/NutritionFoodLabels";

export const Route = createFileRoute("/_app/nutrition")({
  component: NutritionPage,
});

type Tab = "daily" | "tracking" | "search" | "ai";

const tabs: { key: Tab; label: string }[] = [
  { key: "daily", label: "יומי" },
  { key: "tracking", label: "מעקב" },
  { key: "search", label: "חיפוש" },
  { key: "ai", label: "זיהוי AI" },
];

function NutritionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("daily");

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-nutrition/15 flex items-center justify-center">
          <Apple className="h-5 w-5 text-nutrition" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">תזונה</h2>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Leaf className="h-3 w-3 text-nutrition" />
            <span>יום תזונתי מאוזן</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-secondary/30 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "daily" && (
        <div className="space-y-5">
          <NutritionDynamicGoals />
          <NutritionMacroRings />
          <NutritionQuickAdd />
          <NutritionMealCards />
          <NutritionFavorites />
        </div>
      )}

      {activeTab === "tracking" && (
        <div className="space-y-5">
          <NutritionTDEECalculator />
          <WeightTracker />
          <NutritionWeightChart />
        </div>
      )}

      {activeTab === "search" && (
        <div className="space-y-5">
          <NutritionFoodSearch />
          <NutritionFavorites />
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-5">
          <NutritionPhotoAnalyzer />
          <NutritionRecipeGenerator />
          <NutritionFoodLabels />
        </div>
      )}
    </div>
  );
}
