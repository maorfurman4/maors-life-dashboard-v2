-- Task 1: per-set breakdown + template FK
-- sets_data: JSONB array of {reps, weight_kg} per set (backward-compatible)
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS sets_data JSONB DEFAULT '[]';

-- template_id: which template spawned this workout (for Smart Auto-Update)
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS template_id UUID
    REFERENCES public.workout_templates(id) ON DELETE SET NULL;
