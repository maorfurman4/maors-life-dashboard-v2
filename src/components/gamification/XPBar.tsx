import { useGamification } from "@/hooks/useGamification";
import { AIAutopilotBadge } from "@/components/gamification/AIAutopilotBadge";

export function XPBar() {
  const { level, progress, isLoading } = useGamification();

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 opacity-50">
        <div className="h-4 w-8 bg-white/10 rounded animate-pulse" />
        <div className="h-1.5 w-20 bg-white/10 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5" dir="ltr" title={`${progress.current}/${progress.next} XP`}>
      {/* AI Autopilot badge — only visible after first bot-logged expense */}
      <AIAutopilotBadge />
      {/* Level badge */}
      <span className="text-xs font-bold text-yellow-400 whitespace-nowrap">
        Lv.{level}
      </span>

      {/* XP bar */}
      <div className="relative w-16 md:w-20 h-1.5 bg-white/15 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {/* XP text */}
      <span className="text-[10px] text-white/50 whitespace-nowrap hidden md:block">
        {progress.current}/{progress.next}
      </span>
    </div>
  );
}
