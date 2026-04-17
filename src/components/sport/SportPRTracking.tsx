import { Trophy } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export function SportPRTracking() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-sport" />
        <h3 className="text-sm font-bold">שיאים אישיים (PR)</h3>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={Trophy}
          message="אין שיאים עדיין — הוסף אימונים כדי לעקוב אחרי שיאים"
          colorClass="text-sport"
        />
      </div>
    </div>
  );
}
