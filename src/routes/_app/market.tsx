import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { MarketPortfolio } from "@/components/market/MarketPortfolio";
import { MarketCards } from "@/components/market/MarketCards";
import { MarketWatchlist } from "@/components/market/MarketWatchlist";
import { MarketActions } from "@/components/market/MarketActions";

export const Route = createFileRoute("/_app/market")({
  component: MarketPage,
});

function MarketPage() {
  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-market/15 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-market" />
          </div>
          <div>
            <h1 className="text-xl font-bold">שוק ההון</h1>
            <p className="text-xs text-muted-foreground">נתונים חיים</p>
          </div>
        </div>
        <div className="flex items-center gap-1 h-6 px-2 rounded-full bg-emerald-400/10">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-medium text-emerald-400">LIVE</span>
        </div>
      </div>

      <MarketPortfolio />
      <MarketActions />
      <MarketCards />
      <MarketWatchlist />
    </div>
  );
}
