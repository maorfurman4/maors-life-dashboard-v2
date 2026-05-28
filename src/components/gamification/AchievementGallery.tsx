import { useGamification } from "@/hooks/useGamification";
import { ACHIEVEMENTS, type AchievementKey } from "@/lib/gamification";

export function AchievementGallery() {
  const { achievements, isLoading } = useGamification();

  const allKeys = Object.keys(ACHIEVEMENTS) as AchievementKey[];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4" dir="rtl">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4" dir="rtl">
      <h2 className="text-lg font-bold text-white mb-4">הישגים</h2>
      <div className="grid grid-cols-2 gap-3">
        {allKeys.map((key) => {
          const achievement = ACHIEVEMENTS[key];
          const unlocked = achievements.includes(key);

          return (
            <div
              key={key}
              className={[
                "flex flex-col gap-1.5 p-3 rounded-2xl border transition-all",
                unlocked
                  ? "bg-gradient-to-br from-yellow-900/40 to-orange-900/30 border-yellow-500/30"
                  : "bg-white/3 border-white/8 opacity-50 grayscale",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span className={["text-2xl", unlocked ? "" : "grayscale opacity-50"].join(" ")}>
                  {achievement.icon}
                </span>
                {unlocked && (
                  <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full">
                    +{achievement.xp} XP
                  </span>
                )}
              </div>
              <p className={["text-xs font-bold leading-tight", unlocked ? "text-white" : "text-white/40"].join(" ")}>
                {achievement.title}
              </p>
              <p className={["text-[10px] leading-tight", unlocked ? "text-white/60" : "text-white/25"].join(" ")}>
                {achievement.description}
              </p>
              {!unlocked && (
                <p className="text-[10px] text-white/25 mt-auto">נעול 🔒</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
