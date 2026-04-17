import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export function MarketCards() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <EmptyState
        icon={TrendingUp}
        message="אין מדדים עדיין — הוסף סימבולים למעקב"
        colorClass="text-market"
      />
    </div>
  );
}
