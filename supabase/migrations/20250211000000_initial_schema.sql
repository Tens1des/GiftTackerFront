-- =============================================================================
-- Запуск: в Supabase Dashboard откройте SQL Editor -> New query,
-- вставьте СОДЕРЖИМОЕ этого файла целиком (не путь к файлу!) и нажмите Run.
-- =============================================================================
-- Вишлисты: схема под Supabase Auth + RLS (владелец не видит кто резервировал/вносил)

-- Профили (имя пользователя из auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Триггер: создавать профиль при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO UPDATE SET name = COALESCE(EXCLUDED.name, profiles.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Вишлисты
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  deadline_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlists_slug ON public.wishlists(slug);
CREATE INDEX IF NOT EXISTS idx_wishlists_owner ON public.wishlists(owner_id);

-- Подарки (с reserved_at и total_contributed_cents для владельца без раскрытия участников)
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  price_cents INT,
  image_url TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reserved_at TIMESTAMPTZ,
  total_contributed_cents INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON public.wishlist_items(wishlist_id);

-- Резервы (владелец не видит participant_name — только факт reserved_at на item)
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.wishlist_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  participant_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id)
);

CREATE INDEX IF NOT EXISTS idx_reservations_item ON public.reservations(item_id);

-- Триггер: при резерве/снятии обновлять reserved_at на item
CREATE OR REPLACE FUNCTION public.sync_reserved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.wishlist_items SET reserved_at = NOW() WHERE id = NEW.item_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.wishlist_items SET reserved_at = NULL WHERE id = OLD.item_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_reserved_at_trigger ON public.reservations;
CREATE TRIGGER sync_reserved_at_trigger
  AFTER INSERT OR DELETE ON public.reservations
  FOR EACH ROW EXECUTE PROCEDURE public.sync_reserved_at();

-- Взносы (владелец не видит кто внёс)
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.wishlist_items(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  participant_name TEXT NOT NULL,
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributions_item ON public.contributions(item_id);

-- Триггер: пересчёт total_contributed_cents на item
CREATE OR REPLACE FUNCTION public.sync_total_contributed()
RETURNS TRIGGER AS $$
DECLARE
  iid UUID;
BEGIN
  iid := COALESCE(NEW.item_id, OLD.item_id);
  UPDATE public.wishlist_items
  SET total_contributed_cents = COALESCE((
    SELECT SUM(amount_cents)::INT FROM public.contributions WHERE item_id = iid
  ), 0)
  WHERE id = iid;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_total_contributed_trigger ON public.contributions;
CREATE TRIGGER sync_total_contributed_trigger
  AFTER INSERT OR DELETE OR UPDATE OF amount_cents ON public.contributions
  FOR EACH ROW EXECUTE PROCEDURE public.sync_total_contributed();

-- Комментарии к подаркам (владелец видит только body и created_at — через view)
CREATE TABLE IF NOT EXISTS public.item_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.wishlist_items(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_item_comments_item ON public.item_comments(item_id);

-- Владелец запрашивает только эту view (security_invoker = права текущего пользователя, не создателя view)
CREATE VIEW public.item_comments_for_owner
  WITH (security_invoker = on) AS
  SELECT id, item_id, body, created_at FROM public.item_comments;

-- Вспомогательные функции для RLS
CREATE OR REPLACE FUNCTION public.is_wishlist_owner(wid UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.wishlists WHERE id = wid AND owner_id = uid);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_wishlist_owner_id(iid UUID)
RETURNS UUID AS $$
  SELECT owner_id FROM public.wishlists w
  JOIN public.wishlist_items i ON i.wishlist_id = w.id
  WHERE i.id = iid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS: включаем для всех таблиц
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_comments ENABLE ROW LEVEL SECURITY;

-- Профили: читать/обновлять только свой; вставка своей записи (для регистрации и upsert с фронта)
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Вишлисты: читать все (публичные по slug), создавать авторизованные, менять только свои
CREATE POLICY "wishlists_select_all" ON public.wishlists FOR SELECT USING (true);
CREATE POLICY "wishlists_insert_auth" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "wishlists_update_own" ON public.wishlists FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "wishlists_delete_own" ON public.wishlists FOR DELETE USING (auth.uid() = owner_id);

-- Подарки: читать если виден вишлист; писать только владелец вишлиста
CREATE POLICY "wishlist_items_select_all" ON public.wishlist_items FOR SELECT USING (true);
CREATE POLICY "wishlist_items_insert_owner" ON public.wishlist_items FOR INSERT
  WITH CHECK (public.is_wishlist_owner(wishlist_id, auth.uid()));
CREATE POLICY "wishlist_items_update_owner" ON public.wishlist_items FOR UPDATE
  USING (public.is_wishlist_owner(wishlist_id, auth.uid()));
CREATE POLICY "wishlist_items_delete_owner" ON public.wishlist_items FOR DELETE
  USING (public.is_wishlist_owner(wishlist_id, auth.uid()));

-- Резервы: владелец вишлиста НЕ видит строки (не видит кто зарезервировал)
CREATE POLICY "reservations_select_not_owner" ON public.reservations FOR SELECT
  USING (public.get_wishlist_owner_id(item_id) IS DISTINCT FROM auth.uid());
CREATE POLICY "reservations_insert_any" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "reservations_delete_any" ON public.reservations FOR DELETE USING (true);

-- Взносы: владелец вишлиста НЕ видит строки
CREATE POLICY "contributions_select_not_owner" ON public.contributions FOR SELECT
  USING (public.get_wishlist_owner_id(item_id) IS DISTINCT FROM auth.uid());
CREATE POLICY "contributions_insert_any" ON public.contributions FOR INSERT WITH CHECK (true);

-- Комментарии: читать все (владелец использует view item_comments_for_owner)
CREATE POLICY "item_comments_select_all" ON public.item_comments FOR SELECT USING (true);
CREATE POLICY "item_comments_insert_any" ON public.item_comments FOR INSERT WITH CHECK (true);

-- Права (Supabase по умолчанию даёт anon/authenticated доступ к public)
GRANT SELECT ON public.item_comments_for_owner TO anon, authenticated;

-- Realtime: публикация изменений по вишлистам (может уже быть в проекте)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'wishlist_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wishlist_items;
  END IF;
END $$;
