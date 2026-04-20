import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { MarketPortfolio } from "@/components/market/MarketPortfolio";
import { MarketCards } from "@/components/market/MarketCards";
import { MarketWatchlist } from "@/components/market/MarketWatchlist";
import { MarketActions } from "@/components/market/MarketActions";
import { MarketPriceChart } from "@/components/market/MarketPriceChart";
import { MarketSmartSummary } from "@/components/market/MarketSmartSummary";
import { MarketAlerts } from "@/components/market/MarketAlerts";

export const Route = createFileRoute("/_app/market")({
  component: MarketPage,
});

type Tab = "portfolio" | "watchlist" | "analysis";

const tabs: { key: Tab; label: string }[] = [
  { key: "portfolio", label: "תיק השקעות" },
  { key: "watchlist", label: "מעקב" },
  { key: "analysis",  label: "ניתוח" },
];

function MarketPage() {
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");

  return (
    <div className="space-y-5 pb-8 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-market/15 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-market" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ letterSpacing: 0 }}>שוק ההון</h1>
            <p className="text-xs text-muted-foreground">ניהול תיק · ניתוח · מעקב בזמן אמת</p>
          </div>
        </div>
        <div className="flex items-center gap-1 h-6 px-2 rounded-full bg-emerald-400/10">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-medium text-emerald-400">LIVE</span>
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

      {activeTab === "portfolio" && (
        <div className="space-y-5">
          <MarketPortfolio />
          <MarketActions />
          <MarketPriceChart />
        </div>
      )}

      {activeTab === "watchlist" && (
        <div className="space-y-5">
          <MarketCards />
          <MarketWatchlist />
          <MarketAlerts />
        </div>
      )}

      {activeTab === "analysis" && (
        <div className="space-y-5">
          <MarketSmartSummary />
        </div>
      )}
    </div>
  );
}
