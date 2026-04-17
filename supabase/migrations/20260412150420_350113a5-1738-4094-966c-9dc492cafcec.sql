-- Fix 1: Add missing DELETE policy on user_settings
CREATE POLICY "Users can delete own settings"
ON public.user_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Fix 2: Ensure body-progress bucket is private (it already is, but let's make sure)
UPDATE storage.buckets SET public = false WHERE id = 'body-progress';