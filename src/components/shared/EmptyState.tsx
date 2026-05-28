import { Plus, type LucideIcon } from "lucide-react";

// ─── Legacy props (kept for backward compatibility) ───────────────────────────

interface EmptyStateLegacyProps {
  icon: LucideIcon;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  colorClass?: string;
}

// ─── Enhanced props ────────────────────────────────────────────────────────────

interface EmptyStateEnhancedProps {
  icon: LucideIcon;
  /** Primary Hebrew title shown in bold */
  title: string;
  /** Optional descriptive subtitle */
  description?: string;
  /** Optional CTA button */
  action?: { label: string; onClick: () => void };
  colorClass?: string;
  // Legacy compat aliases (if both message and title are passed, title wins)
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

type EmptyStateProps = EmptyStateLegacyProps | EmptyStateEnhancedProps;

function isEnhanced(props: EmptyStateProps): props is EmptyStateEnhancedProps {
  return "title" in props;
}

export function EmptyState(props: EmptyStateProps) {
  const { icon: Icon, colorClass = "text-muted-foreground" } = props;

  if (isEnhanced(props)) {
    const { title, description, action } = props;
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center" dir="rtl">
        <div
          className={`h-12 w-12 rounded-2xl bg-secondary/40 flex items-center justify-center ${colorClass} opacity-50`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors text-xs font-medium ${colorClass}`}
          >
            <Plus className="h-3.5 w-3.5" />
            {action.label}
          </button>
        )}
      </div>
    );
  }

  // Legacy render path
  const { message, actionLabel, onAction } = props as EmptyStateLegacyProps;
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div
        className={`h-12 w-12 rounded-2xl bg-secondary/40 flex items-center justify-center ${colorClass} opacity-50`}
      >
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
