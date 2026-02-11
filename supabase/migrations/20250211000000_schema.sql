-- Вишлисты: список желаний с секретным токеном для владельца
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  edit_token text not null,
  title text not null,
  occasion text,
  owner_name text,
  created_at timestamptz default now()
);

-- Подарки в вишлисте
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  title text not null,
  url text,
  image_url text,
  price numeric(12,2),
  target_amount numeric(12,2), -- для сбора с друзей; null = один даритель
  is_unavailable boolean default false, -- товар удалён/недоступен
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Резервации: кто какой подарок взял (владелец НЕ видит эти данные в UI)
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.wishlist_items(id) on delete cascade,
  reserved_by_nickname text not null,
  reserved_at timestamptz default now(),
  unique(item_id) -- один подарок — один резерв
);

-- Взносы в общий подарок (владелец не видит кто сколько скинул)
create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.wishlist_items(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  contributed_by_nickname text not null,
  contributed_at timestamptz default now()
);

-- Индексы для realtime и запросов
create index if not exists idx_wishlist_items_wishlist on public.wishlist_items(wishlist_id);
create index if not exists idx_reservations_item on public.reservations(item_id);
create index if not exists idx_contributions_item on public.contributions(item_id);

-- Realtime: включаем для таблиц
alter publication supabase_realtime add table public.wishlist_items;
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.contributions;

-- Политики: анонимное чтение/запись по slug (для простоты — без auth)
-- В продакшене можно ограничить RLS по домену или по временным токенам
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.reservations enable row level security;
alter table public.contributions enable row level security;

create policy "Wishlists readable by anyone" on public.wishlists for select using (true);
create policy "Wishlists insert" on public.wishlists for insert with check (true);
create policy "Wishlists update with edit_token" on public.wishlists for update using (true);

create policy "Items readable" on public.wishlist_items for select using (true);
create policy "Items insert" on public.wishlist_items for insert with check (true);
create policy "Items update" on public.wishlist_items for update using (true);
create policy "Items delete" on public.wishlist_items for delete using (true);

create policy "Reservations readable" on public.reservations for select using (true);
create policy "Reservations insert" on public.reservations for insert with check (true);
create policy "Reservations delete" on public.reservations for delete using (true);

create policy "Contributions readable" on public.contributions for select using (true);
create policy "Contributions insert" on public.contributions for insert with check (true);
