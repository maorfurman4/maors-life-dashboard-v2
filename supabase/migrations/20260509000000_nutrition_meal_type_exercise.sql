-- Allow meal_type = 'exercise' for workout calorie burn entries
ALTER TABLE public.nutrition_entries
  DROP CONSTRAINT IF EXISTS nutrition_entries_meal_type_check;

ALTER TABLE public.nutrition_entries
  ADD CONSTRAINT nutrition_entries_meal_type_check
  CHECK (meal_type IN ('breakfast','lunch','dinner','snack','exercise'));
