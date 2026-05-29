export const XP_VALUES = {
  workout_logged: 50,
  meal_logged: 15,
  water_logged: 5,
  shift_logged: 10,
  pr_achieved: 100,
} as const;

export type AchievementKey =
  | 'first_workout' | 'workouts_10' | 'workouts_50' | 'workouts_100'
  | 'streak_3' | 'streak_7' | 'streak_30'
  | 'first_meal' | 'meals_50' | 'first_shift' | 'shifts_20'
  | 'first_pr' | 'all_modules_used'
  | 'ai_autopilot_first';

export const ACHIEVEMENTS: Record<AchievementKey, { title: string; description: string; xp: number; icon: string }> = {
  first_workout: { title: 'אימון ראשון!', description: 'רשמת את האימון הראשון שלך', xp: 100, icon: '💪' },
  workouts_10: { title: '10 אימונים', description: 'הגעת ל-10 אימונים!', xp: 200, icon: '🏋️' },
  workouts_50: { title: '50 אימונים', description: 'מדהים — 50 אימונים!', xp: 500, icon: '🏆' },
  workouts_100: { title: 'מאה אימונים!', description: 'אגדה מוחלטת', xp: 1000, icon: '🎖️' },
  streak_3: { title: '3 ימים ברצף', description: 'שלושה ימי אימון ברצף', xp: 75, icon: '🔥' },
  streak_7: { title: 'שבוע שלם!', description: 'שבעה ימים ברצף', xp: 200, icon: '🔥' },
  streak_30: { title: 'חודש שלם!', description: 'שלושים ימים ברצף — מדהים!', xp: 1000, icon: '🌟' },
  first_meal: { title: 'ארוחה ראשונה', description: 'רשמת את הארוחה הראשונה', xp: 50, icon: '🍽️' },
  meals_50: { title: '50 ארוחות', description: 'עקבת אחרי 50 ארוחות', xp: 300, icon: '🥗' },
  first_shift: { title: 'משמרת ראשונה', description: 'רשמת את המשמרת הראשונה', xp: 50, icon: '💼' },
  shifts_20: { title: '20 משמרות', description: 'עובד קשה!', xp: 200, icon: '⏰' },
  first_pr: { title: 'שיא אישי!', description: 'שברת שיא אישי', xp: 150, icon: '🎯' },
  all_modules_used: { title: 'כל המודולים', description: 'השתמשת בכל מודולי האפלקציה', xp: 500, icon: '🌈' },
  ai_autopilot_first: { title: 'AI Autopilot', description: 'רשמת הוצאה ראשונה דרך הבוט האישי', xp: 50, icon: '🤖' },
};

export function xpToLevel(xp: number): number {
  if (xp < 500) return 1;
  if (xp < 1500) return 2;
  if (xp < 3500) return 3;
  if (xp < 7000) return 4;
  if (xp < 12000) return 5;
  if (xp < 20000) return 6;
  return Math.floor(xp / 5000) + 2;
}

export function levelProgress(xp: number): { current: number; next: number; percent: number } {
  const thresholds = [0, 500, 1500, 3500, 7000, 12000, 20000];
  const level = xpToLevel(xp);
  const currentThreshold = thresholds[Math.min(level - 1, thresholds.length - 1)] ?? 0;
  // For levels beyond the defined thresholds, compute the next threshold dynamically
  const nextThreshold =
    level < thresholds.length
      ? (thresholds[level] ?? xp + 5000)
      : xp + 5000;
  const range = nextThreshold - currentThreshold;
  // Guard against division by zero (e.g. at max defined level)
  const percent = range === 0 ? 100 : Math.min(100, Math.max(0, Math.round(((xp - currentThreshold) / range) * 100)));
  return { current: xp - currentThreshold, next: Math.max(0, nextThreshold - currentThreshold), percent };
}
