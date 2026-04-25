-- Fix missing RLS DELETE policies on profiles and user_settings
-- profiles: had SELECT/INSERT/UPDATE but no DELETE
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- user_settings: had SELECT/INSERT/UPDATE but no DELETE
CREATE POLICY "Users can delete own settings"
  ON public.user_settings FOR DELETE
  USING (auth.uid() = user_id);
