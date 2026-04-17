---
name: Sport advanced features
description: Exercise library with muscle filter, rest timer, weekly workout plan generator
type: feature
---
- `src/lib/exercise-library.ts` — 35+ exercises with muscle groups, difficulty, equipment, shoulder-safe flag, default sets/reps/rest
- `src/components/sport/ExerciseLibrary.tsx` — search by name/muscle, filter by muscle group, shoulder-safe toggle, detail modal with rest timer
- `src/components/sport/RestTimer.tsx` — fullscreen modal timer with audio beep + vibration, presets 30/45/60/90/120/180s, ±15s adjust
- `src/components/sport/SportWeeklyPlan.tsx` — generates 3/4/5-day plans by goal (strength/endurance/balanced/weight_loss), saves any day as workout_template
- New tab in sport route: "library"
- All respect user's shoulder sensitivity
