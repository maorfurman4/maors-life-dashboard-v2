import { Eye, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export function MarketWatchlist() {
  const watchlist: unknown[] = [];

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-market" />
          <h3 className="text-sm font-semibold text-muted-foreground">רשימת מעקב</h3>
        </div>
      </div>
      {watchlist.length === 0 ? (
        <EmptyState
          icon={Eye}
          message="אין סימבולים ברשימת המעקב — הוסף סימבולים למעקב"
          colorClass="text-market"
        />
      ) : null}
    </div>
  );
}
