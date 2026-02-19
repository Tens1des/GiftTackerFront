-- 1) Профили: разрешить пользователю создавать свою запись (для регистрации и upsert с фронта)
-- 2) View без Security Definer: пересоздать с security_invoker, чтобы применялись RLS текущего пользователя

-- Политика INSERT для profiles (иначе upsert после signUp блокируется RLS)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Пересоздать view с правами вызывающего (убирает предупреждение Security Definer)
DROP VIEW IF EXISTS public.item_comments_for_owner;
CREATE VIEW public.item_comments_for_owner
  WITH (security_invoker = on) AS
  SELECT id, item_id, body, created_at FROM public.item_comments;

GRANT SELECT ON public.item_comments_for_owner TO anon, authenticated;
