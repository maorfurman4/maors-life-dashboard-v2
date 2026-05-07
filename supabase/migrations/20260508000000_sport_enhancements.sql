-- ================================================================
-- Sport Enhancements: Task 0 approved migration
-- 1. workout_exercises  : +duration_seconds, +is_warmup
-- 2. workout_templates  : +is_system, user_id nullable, RLS update
-- 3. user_settings      : +favorite_exercises, +hidden_exercises
-- 4. Seed 6 system templates
-- ================================================================

-- ── 1. workout_exercises ─────────────────────────────────────────
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS is_warmup         BOOLEAN NOT NULL DEFAULT false;

-- ── 2. workout_templates ─────────────────────────────────────────
-- Allow NULL user_id so system-owned templates can exist
ALTER TABLE public.workout_templates
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.workout_templates
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

-- Drop old narrow SELECT policy; replace with one that exposes system rows
DROP POLICY IF EXISTS "Users can view own templates" ON public.workout_templates;
CREATE POLICY "Users can view templates"
  ON public.workout_templates FOR SELECT
  USING (is_system = true OR auth.uid() = user_id);

-- Prevent deletion of system templates
DROP POLICY IF EXISTS "Users can delete own templates" ON public.workout_templates;
CREATE POLICY "Users can delete own templates"
  ON public.workout_templates FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- ── 3. user_settings ─────────────────────────────────────────────
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS favorite_exercises TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hidden_exercises   TEXT[] NOT NULL DEFAULT '{}';

-- ── 4. System template seeds ─────────────────────────────────────
INSERT INTO public.workout_templates
  (user_id, name, category, exercises, estimated_duration_minutes, is_system)
VALUES

-- Template 1: Upper body strength
(NULL, 'כוח עליון — חזה וכתפיים', 'weights',
 '[
   {"name":"לחיצת חזה שכיבה","sets":4,"reps":8,"weight_kg":0},
   {"name":"לחיצת כתפיים (OHP)","sets":3,"reps":10,"weight_kg":0},
   {"name":"פרפר (Fly)","sets":3,"reps":12,"weight_kg":0},
   {"name":"הרמות צד (Lateral Raise)","sets":3,"reps":15,"weight_kg":0},
   {"name":"מקבילים (Dips)","sets":3,"reps":12,"weight_kg":0}
 ]'::jsonb,
 60, true),

-- Template 2: Lower body strength
(NULL, 'כוח תחתון — רגליים וישבן', 'weights',
 '[
   {"name":"סקוואט (Squat)","sets":4,"reps":8,"weight_kg":0},
   {"name":"לאנגים (Lunges)","sets":3,"reps":12,"weight_kg":0},
   {"name":"לג קרל (Leg Curl)","sets":3,"reps":12,"weight_kg":0},
   {"name":"עגל (Calf Raise)","sets":4,"reps":20,"weight_kg":0},
   {"name":"לג פרס (Leg Press)","sets":3,"reps":10,"weight_kg":0}
 ]'::jsonb,
 60, true),

-- Template 3: Back & Pull
(NULL, 'גב ומשיכה', 'weights',
 '[
   {"name":"מתח (Pull-up)","sets":4,"reps":8,"weight_kg":0},
   {"name":"חתירה (Barbell Row)","sets":4,"reps":10,"weight_kg":0},
   {"name":"לט פולדאון","sets":3,"reps":12,"weight_kg":0},
   {"name":"חתירה כבלים ישיבה","sets":3,"reps":12,"weight_kg":0},
   {"name":"Face Pull","sets":3,"reps":15,"weight_kg":0}
 ]'::jsonb,
 50, true),

-- Template 4: Core & Abs
(NULL, 'ליבה ובטן', 'mixed',
 '[
   {"name":"פלנק (Plank)","sets":3,"reps":60,"weight_kg":0},
   {"name":"כפיפות בטן (Crunch)","sets":4,"reps":20,"weight_kg":0},
   {"name":"רוסיאן טוויסט","sets":3,"reps":20,"weight_kg":0},
   {"name":"הרמות רגליים","sets":3,"reps":15,"weight_kg":0},
   {"name":"Dead Bug","sets":3,"reps":10,"weight_kg":0}
 ]'::jsonb,
 30, true),

-- Template 5: Calisthenics for beginners
(NULL, 'קלסטניקס — מתחילים', 'calisthenics',
 '[
   {"name":"שכיבות סמיכה","sets":4,"reps":12,"weight_kg":0},
   {"name":"מתח (Pull-up)","sets":3,"reps":6,"weight_kg":0},
   {"name":"מקבילים (Dips)","sets":3,"reps":10,"weight_kg":0},
   {"name":"סקוואט משקל גוף","sets":3,"reps":20,"weight_kg":0},
   {"name":"פלנק (Plank)","sets":3,"reps":45,"weight_kg":0}
 ]'::jsonb,
 45, true),

-- Template 6: HIIT fat burn
(NULL, 'HIIT — שריפת שומן', 'mixed',
 '[
   {"name":"בורפי (Burpee)","sets":4,"reps":10,"weight_kg":0},
   {"name":"סקוואט קפיצה","sets":4,"reps":12,"weight_kg":0},
   {"name":"Mountain Climbers","sets":4,"reps":20,"weight_kg":0},
   {"name":"שכיבות סמיכה","sets":3,"reps":15,"weight_kg":0},
   {"name":"High Knees","sets":4,"reps":30,"weight_kg":0}
 ]'::jsonb,
 25, true);
