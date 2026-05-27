interface StreakBadgeProps {
  type: 'workout' | 'nutrition';
  count: number;
}

export function StreakBadge({ count }: StreakBadgeProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded-full px-2 py-0.5">
      <span className="text-sm leading-none">🔥</span>
      <span className="text-xs font-bold text-orange-400">{count}</span>
    </div>
  );
}
