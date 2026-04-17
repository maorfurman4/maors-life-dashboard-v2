import { Plus, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  colorClass?: string;
}

export function EmptyState({ icon: Icon, message, actionLabel, onAction, colorClass = "text-muted-foreground" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className={`h-12 w-12 rounded-2xl bg-secondary/40 flex items-center justify-center ${colorClass} opacity-50`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm text-muted-foreground text-center">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors text-xs font-medium ${colorClass}`}
        >
          <Plus className="h-3.5 w-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
