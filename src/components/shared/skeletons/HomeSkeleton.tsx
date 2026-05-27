import { CardSkeleton } from "./CardSkeleton";

export function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-4" dir="rtl">
      {/* Greeting bar */}
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-7 w-36 rounded bg-muted" />
      </div>

      {/* 2×2 cube grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/5] rounded-3xl bg-muted"
          />
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
      </div>
    </div>
  );
}
