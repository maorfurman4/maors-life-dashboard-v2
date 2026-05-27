import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  lines?: number;
  className?: string;
}

export function CardSkeleton({ lines = 3, className }: CardSkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 animate-pulse", className)}>
      <div className="h-4 w-2/3 rounded bg-muted mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn("h-3 rounded bg-muted mb-2", i === lines - 1 ? "w-1/2" : "w-full")}
        />
      ))}
    </div>
  );
}
