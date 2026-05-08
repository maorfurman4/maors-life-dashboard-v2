-- Allow users to hard-delete any template, including system templates
DROP POLICY IF EXISTS "Users can delete own templates" ON public.workout_templates;
CREATE POLICY "Users can delete own templates"
  ON public.workout_templates FOR DELETE
  USING (auth.uid() IS NOT NULL);
