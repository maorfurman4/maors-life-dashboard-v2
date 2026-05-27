import { useEffect, useState } from "react";
import { ACHIEVEMENTS, type AchievementKey } from "@/lib/gamification";

interface AchievementToastProps {
  achievementKey: AchievementKey | null;
  onDismiss: () => void;
}

export function AchievementToast({ achievementKey, onDismiss }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!achievementKey) {
      setVisible(false);
      return;
    }
    // Trigger entrance animation
    const showTimer = requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss after 4 seconds
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // wait for exit animation
    }, 4000);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [achievementKey, onDismiss]);

  if (!achievementKey) return null;

  const achievement = ACHIEVEMENTS[achievementKey];

  return (
    <div
      className={[
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-[200]",
        "flex items-center gap-3 px-4 py-3 rounded-2xl",
        "bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-md",
        "border border-yellow-400/30 shadow-2xl shadow-orange-900/50",
        "transition-all duration-300 ease-out",
        "max-w-[90vw] md:max-w-sm cursor-pointer select-none",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8",
      ].join(" ")}
      onClick={() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }}
      role="alert"
      aria-live="polite"
    >
      <span className="text-3xl leading-none">{achievement.icon}</span>
      <div className="flex-1 min-w-0" dir="rtl">
        <p className="text-sm font-black text-white leading-tight">{achievement.title}</p>
        <p className="text-xs text-white/80 mt-0.5 leading-tight">{achievement.description}</p>
        <p className="text-xs font-bold text-yellow-200 mt-0.5">+{achievement.xp} XP</p>
      </div>
    </div>
  );
}
