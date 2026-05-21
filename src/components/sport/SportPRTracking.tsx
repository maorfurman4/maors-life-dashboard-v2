import { Trophy } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePersonalRecords } from "@/hooks/use-sport-data";

export function SportPRTracking() {
  const { data: prs = [], isLoading } = usePersonalRecords();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-sport" />
        <h3 className="text-sm font-bold">שיאים אישיים (PR)</h3>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0 animate-pulse">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : prs.length === 0 ? (
          <EmptyState
            icon={Trophy}
            message="אין שיאים עדיין — הוסף אימונים כדי לעקוב אחרי שיאים"
            colorClass="text-sport"
          />
        ) : (
          <div className="divide-y divide-border/50">
            {prs.map((pr: any) => {
              // Parse date parts directly to avoid UTC→local timezone shift (off-by-1 day for IL users)
              const [prYear, prMonth, prDay] = (pr.date as string).split("-").map(Number);
              const dateStr = `${String(prDay).padStart(2,"0")}/${String(prMonth).padStart(2,"0")}/${prYear}`;
              return (
                <div key={pr.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{pr.exercise_name}</p>
                    <p className="text-[10px] text-muted-foreground">{dateStr}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-sport">{pr.value} {pr.unit || 'ק"ג'}</p>
                    {pr.category && (
                      <p className="text-[10px] text-muted-foreground">{pr.category}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
