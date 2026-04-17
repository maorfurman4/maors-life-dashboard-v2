import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export function DailyOverview() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">משימות היום</h3>
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={ClipboardList}
          message="אין משימות היום"
        />
      </div>
    </div>
  );
}
