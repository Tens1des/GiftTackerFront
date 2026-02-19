/**
 * API: при наличии VITE_SUPABASE_URL используется Supabase (Auth + данные + Realtime).
 * Иначе — бэкенд Go по VITE_API_URL.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { Wishlist, WishlistItem } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const AUTH_TOKEN_KEY = 'auth_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

function getBase() {
  if (API_BASE) return API_BASE.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:8081';
}

type ApiOptions = Omit<RequestInit, 'body'> & { body?: Record<string, unknown> };

async function goApi<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { body, ...rest } = opts;
  const method = rest.method ?? 'GET';
  const url = getBase() + path;
  const headers: Record<string, string> = { ...(rest.headers as Record<string, string>) };
  if (body != null && method !== 'GET') headers['Content-Type'] = 'application/json';
  const token = getStoredToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...rest, method, headers, credentials: 'include', body: body != null ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ——— Общие типы ———
export interface ApiUser {
  id: string;
  email: string;
  name: string;
}

export interface ApiComment {
  id: string;
  item_id: string;
  body: string;
  created_at: string;
}

export interface ApiWishlistItem {
  id: string;
  wishlist_id: string;
  title: string;
  url: string;
  image_url: string;
  price_cents: number | null;
  position: number;
  reserved: boolean;
  reserved_by: string;
  reserved_by_me?: boolean;
  total_contributed_cents: number;
  allow_contributions: boolean;
  target_cents: number;
  comments?: ApiComment[];
}

export interface ApiWishlist {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string;
  owner_name: string;
  deadline_at?: string | null;
  items?: ApiWishlistItem[];
}

function mapItem(a: ApiWishlistItem): WishlistItem {
  const priceRub = a.price_cents != null ? a.price_cents / 100 : null;
  const targetRub = a.target_cents ? a.target_cents / 100 : null;
  return {
    id: a.id,
    wishlist_id: a.wishlist_id,
    title: a.title,
    url: a.url || null,
    image_url: a.image_url || null,
    price: priceRub,
    target_amount: targetRub ?? priceRub,
    is_unavailable: false,
    sort_order: a.position,
    created_at: '',
    reserved: a.reserved,
    reserved_by: a.reserved_by || undefined,
    reserved_by_me: a.reserved_by_me,
    total_contributed_cents: a.total_contributed_cents,
    target_cents: a.target_cents,
    comments: a.comments ?? [],
  } as WishlistItem;
}

function mapWishlist(a: ApiWishlist): Wishlist {
  const items = Array.isArray(a?.items) ? a.items : [];
  return {
    id: a.id,
    slug: a.slug,
    edit_token: '',
    title: a.title,
    occasion: a.description || null,
    owner_name: a.owner_name || null,
    created_at: '',
    owner_id: a.owner_id,
    deadline_at: a.deadline_at ?? null,
    items: items.map(mapItem),
  };
}

// ——— Supabase: auth ———
async function sbGetMe(): Promise<ApiUser | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle();
  return {
    id: user.id,
    email: user.email ?? '',
    name: (profile?.name as string) ?? user.user_metadata?.name ?? '',
  };
}

async function sbLogin(email: string, password: string): Promise<ApiUser> {
  if (!supabase) throw new Error('Supabase не настроен');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message === 'Invalid login credentials'
      ? 'Неверный email или пароль'
      : error.message;
    throw new Error(msg);
  }
  const u = await sbGetMe();
  if (!u) throw new Error('Не удалось загрузить профиль');
  return u;
}

async function sbRegister(email: string, password: string, name?: string): Promise<ApiUser> {
  if (!supabase) throw new Error('Supabase не настроен');
  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name ?? '' } },
  });
  if (error) throw new Error(error.message);
  if (signUpData?.user) {
    await supabase.from('profiles').upsert({ id: signUpData.user.id, name: name ?? '' }, { onConflict: 'id' });
  }
  const u = await sbGetMe();
  if (!u) throw new Error('Подтвердите email или перезайдите');
  return u;
}

async function sbLogout(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}

// ——— Supabase: slug ———
function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'list';
}

function makeSlug(title: string): string {
  const base = slugify(title).slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

// ——— Supabase: wishlists ———
export interface ApiWishlistShort {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

async function sbGetMyWishlists(): Promise<Wishlist[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: rows, error } = await supabase
    .from('wishlists')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) return [];
  if (!rows?.length) return [];
  return rows.map((w: { id: string; slug: string; title: string; description: string | null; created_at: string; owner_id: string }) => ({
    id: w.id,
    slug: w.slug,
    edit_token: '',
    title: w.title,
    occasion: w.description ?? null,
    owner_name: null,
    created_at: w.created_at,
    owner_id: w.owner_id,
  }));
}

async function sbGetWishlistBySlug(slug: string): Promise<Wishlist | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();

  const { data: w, error: we } = await supabase
    .from('wishlists')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (we || !w) return null;

  const ownerId = w.owner_id as string;
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', ownerId).maybeSingle();
  const ownerName = (profile?.name as string) ?? '';
  const isOwner = user?.id === ownerId;

  const { data: items, error: ie } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlist_id', w.id)
    .order('position', { ascending: true });
  if (ie) return null;
  const itemList = items ?? [];
  const itemIds = itemList.map((i: { id: string }) => i.id);

  let reservations: { item_id: string; participant_name: string; user_id: string | null }[] = [];
  if (itemIds.length) {
    const { data: res } = await supabase.from('reservations').select('item_id, participant_name, user_id').in('item_id', itemIds);
    reservations = res ?? [];
  }

  const commentsTable = isOwner ? 'item_comments_for_owner' : 'item_comments';
  const { data: commentsRows } = await supabase.from(commentsTable).select('*').in('item_id', itemIds);
  const commentsByItem: Record<string, ApiComment[]> = {};
  for (const c of commentsRows ?? []) {
    const itemId = c.item_id as string;
    if (!commentsByItem[itemId]) commentsByItem[itemId] = [];
    commentsByItem[itemId].push({
      id: c.id,
      item_id: itemId,
      body: c.body,
      created_at: c.created_at,
    });
  }

  const apiItems: ApiWishlistItem[] = itemList.map((i: {
    id: string; wishlist_id: string; title: string; url: string | null; image_url: string | null;
    price_cents: number | null; position: number; reserved_at: string | null; total_contributed_cents: number;
  }) => {
    const res = reservations.find((r) => r.item_id === i.id);
    const targetCents = i.price_cents ?? 0;
    const reservedByMe = !isOwner && !!res && !!user?.id && res.user_id === user.id;
    return {
      id: i.id,
      wishlist_id: i.wishlist_id,
      title: i.title,
      url: i.url ?? '',
      image_url: i.image_url ?? '',
      price_cents: i.price_cents,
      position: i.position,
      reserved: Boolean(i.reserved_at),
      reserved_by: res?.participant_name ?? '',
      reserved_by_me: reservedByMe,
      total_contributed_cents: i.total_contributed_cents ?? 0,
      allow_contributions: targetCents > 0,
      target_cents: targetCents,
      comments: commentsByItem[i.id] ?? [],
    };
  });

  const apiWishlist: ApiWishlist = {
    id: w.id,
    owner_id: ownerId,
    title: w.title,
    slug: w.slug,
    description: w.description ?? '',
    owner_name: ownerName,
    deadline_at: w.deadline_at ?? null,
    items: apiItems,
  };
  return mapWishlist(apiWishlist);
}

async function sbCreateWishlist(params: {
  title: string;
  occasion?: string;
  owner_name?: string;
  deadline_at?: string | null;
}): Promise<{ wishlist: Wishlist; editToken: string }> {
  if (!supabase) throw new Error('Supabase не настроен');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Нужна авторизация');

  let slug = makeSlug(params.title);
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase.from('wishlists').select('id').eq('slug', slug).maybeSingle();
    if (!existing) break;
    slug = makeSlug(params.title);
  }

  const row: Record<string, unknown> = {
    owner_id: user.id,
    title: params.title,
    slug,
    description: params.occasion ?? '',
  };
  if (params.deadline_at != null && params.deadline_at !== '') row.deadline_at = params.deadline_at;

  const { data: inserted, error } = await supabase.from('wishlists').insert(row).select().single();
  if (error) throw new Error(error.message);
  const wishlist = mapWishlist({
    id: inserted.id,
    owner_id: inserted.owner_id,
    title: inserted.title,
    slug: inserted.slug,
    description: inserted.description ?? '',
    owner_name: '',
    deadline_at: inserted.deadline_at ?? null,
    items: [],
  });
  return { wishlist, editToken: '' };
}

async function sbUpdateWishlist(
  wishlistId: string,
  patch: { title?: string; description?: string; deadline_at?: string | null }
): Promise<void> {
  if (!supabase) return;
  const body: Record<string, unknown> = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.deadline_at !== undefined) body.deadline_at = patch.deadline_at === '' || patch.deadline_at == null ? null : patch.deadline_at;
  await supabase.from('wishlists').update(body).eq('id', wishlistId);
}

async function sbAddWishlistItem(
  wishlistId: string,
  item: { title: string; url?: string; image_url?: string; price?: number; target_amount?: number }
): Promise<WishlistItem> {
  if (!supabase) throw new Error('Supabase не настроен');
  const priceCents =
    item.target_amount != null ? Math.round(item.target_amount * 100)
    : item.price != null ? Math.round(item.price * 100) : null;
  const { data: maxPos } = await supabase.from('wishlist_items').select('position').eq('wishlist_id', wishlistId).order('position', { ascending: false }).limit(1).maybeSingle();
  const position = (maxPos?.position ?? -1) + 1;
  const { data: inserted, error } = await supabase
    .from('wishlist_items')
    .insert({
      wishlist_id: wishlistId,
      title: item.title,
      url: item.url ?? '',
      image_url: item.image_url ?? '',
      price_cents: priceCents,
      position,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapItem({
    id: inserted.id,
    wishlist_id: inserted.wishlist_id,
    title: inserted.title,
    url: inserted.url ?? '',
    image_url: inserted.image_url ?? '',
    price_cents: inserted.price_cents,
    position: inserted.position,
    reserved: false,
    reserved_by: '',
    total_contributed_cents: 0,
    allow_contributions: (inserted.price_cents ?? 0) > 0,
    target_cents: inserted.price_cents ?? 0,
    comments: [],
  });
}

async function sbUpdateWishlistItem(
  itemId: string,
  patch: Partial<Pick<WishlistItem, 'title' | 'url' | 'image_url' | 'price' | 'target_amount' | 'is_unavailable'>>
): Promise<void> {
  if (!supabase) return;
  const body: Record<string, unknown> = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.url !== undefined) body.url = patch.url ?? '';
  if (patch.image_url !== undefined) body.image_url = patch.image_url ?? '';
  if (patch.target_amount != null) body.price_cents = Math.round(patch.target_amount * 100);
  else if (patch.price != null) body.price_cents = Math.round(patch.price * 100);
  if (Object.keys(body).length) await supabase.from('wishlist_items').update(body).eq('id', itemId);
}

const DELETE_WITH_CONTRIBUTIONS_MSG = 'Нельзя удалить подарок, на который уже скидывались';

async function sbDeleteWishlistItem(itemId: string): Promise<void> {
  if (!supabase) return;
  const { data: row } = await supabase
    .from('wishlist_items')
    .select('total_contributed_cents')
    .eq('id', itemId)
    .maybeSingle();
  if (row && (row.total_contributed_cents ?? 0) > 0) {
    throw new Error(DELETE_WITH_CONTRIBUTIONS_MSG);
  }
  const { error } = await supabase.from('wishlist_items').delete().eq('id', itemId);
  if (error) {
    if (error.code === '23503' || error.message.includes('foreign key') || error.message.includes('restrict')) {
      throw new Error(DELETE_WITH_CONTRIBUTIONS_MSG);
    }
    throw new Error(error.message);
  }
}

async function sbReserveItem(itemId: string, nickname: string): Promise<void> {
  if (!supabase) throw new Error('Supabase не настроен');
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('reservations').insert({
    item_id: itemId,
    user_id: user?.id ?? null,
    participant_name: nickname,
  });
  if (error) throw new Error(error.message);
}

async function sbUnreserveItem(itemId: string): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Нужно войти, чтобы снять резерв');
  const { error } = await supabase.from('reservations').delete().eq('item_id', itemId).eq('user_id', user.id);
  if (error) throw new Error(error.message);
}

const CONTRIBUTION_EXCEED_MSG = 'Сумма взноса не должна превышать оставшуюся сумму сбора';

async function sbAddContribution(itemId: string, amount: number, nickname: string): Promise<void> {
  if (!supabase) throw new Error('Supabase не настроен');
  const amountCents = Math.round(amount * 100);
  const { data: row } = await supabase
    .from('wishlist_items')
    .select('price_cents, total_contributed_cents')
    .eq('id', itemId)
    .maybeSingle();
  if (row) {
    const target = row.price_cents ?? 0;
    const total = row.total_contributed_cents ?? 0;
    if (target > 0 && total + amountCents > target) {
      throw new Error(CONTRIBUTION_EXCEED_MSG);
    }
  }
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('contributions').insert({
    item_id: itemId,
    user_id: user?.id ?? null,
    participant_name: nickname,
    amount_cents: amountCents,
  });
  if (error) throw new Error(error.message);
}

async function sbFetchMetaFromUrl(url: string): Promise<{ title?: string; image?: string; price?: number }> {
  if (!supabase) return {};
  const projectUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
  if (!projectUrl || !anonKey) return {};
  try {
    const res = await fetch(`${projectUrl}/functions/v1/fetch-meta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    return {
      title: data.title,
      image: data.image,
      price: data.price,
    };
  } catch {
    return {};
  }
}

async function sbReorderItems(_wishlistId: string, itemIds: string[]): Promise<void> {
  if (!supabase) return;
  for (let i = 0; i < itemIds.length; i++) {
    await supabase.from('wishlist_items').update({ position: i }).eq('id', itemIds[i]);
  }
}

async function sbAddItemComment(itemId: string, participantName: string, body: string): Promise<ApiComment> {
  if (!supabase) throw new Error('Supabase не настроен');
  const { data, error } = await supabase
    .from('item_comments')
    .insert({ item_id: itemId, participant_name: participantName, body: body.trim() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, item_id: data.item_id, body: data.body, created_at: data.created_at };
}

const STATIC_TEMPLATES: WishlistTemplate[] = [
  { slug: 'birthday', title: 'День рождения', description: 'Подарки на день рождения', example_items: ['Книга', 'Сертификат', 'Цветы'] },
  { slug: 'wedding', title: 'Свадебный список', description: 'Подарки молодожёнам', example_items: ['Посуда', 'Текстиль', 'Электроника'] },
  { slug: 'new-year', title: 'Новый год', description: 'Новогодние желания', example_items: ['Игрушка', 'Сладости', 'Гирлянда'] },
];

export interface WishlistTemplate {
  slug: string;
  title: string;
  description: string;
  example_items: string[];
}

function sbGetWishlistTemplates(): Promise<WishlistTemplate[]> {
  return Promise.resolve(STATIC_TEMPLATES);
}

// ——— Публичный API (ветвление Supabase / Go) ———

export async function getMe(): Promise<ApiUser | null> {
  if (isSupabaseConfigured()) return sbGetMe();
  try {
    return await goApi<ApiUser>('/api/auth/me');
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<ApiUser> {
  if (isSupabaseConfigured()) return sbLogin(email, password);
  const res = await goApi<{ user: ApiUser; token?: string }>('/api/auth/login', { method: 'POST', body: { email, password } });
  if (res.token) setStoredToken(res.token);
  return res.user;
}

export async function register(email: string, password: string, name?: string): Promise<ApiUser> {
  if (isSupabaseConfigured()) return sbRegister(email, password, name);
  const res = await goApi<{ user: ApiUser; token?: string }>('/api/auth/register', { method: 'POST', body: { email, password, name: name || '' } });
  if (res.token) setStoredToken(res.token);
  return res.user;
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured()) {
    await sbLogout();
    return;
  }
  setStoredToken(null);
  try {
    await goApi('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
}

export async function getMyWishlists(): Promise<Wishlist[]> {
  if (isSupabaseConfigured()) return sbGetMyWishlists();
  const list = await goApi<ApiWishlistShort[] | null>('/api/wishlists');
  if (!list || !Array.isArray(list)) return [];
  return list.map((w) => ({
    id: w.id,
    slug: w.slug,
    edit_token: '',
    title: w.title,
    occasion: w.description || null,
    owner_name: null,
    created_at: w.created_at,
    owner_id: w.owner_id,
  }));
}

export async function getWishlistBySlug(slug: string): Promise<Wishlist | null> {
  if (isSupabaseConfigured()) return sbGetWishlistBySlug(slug);
  try {
    const data = await goApi<ApiWishlist | null>(`/api/wishlists/slug/${slug}`);
    if (!data || typeof data !== 'object') return null;
    return mapWishlist(data);
  } catch {
    return null;
  }
}

export async function createWishlist(params: {
  title: string;
  occasion?: string;
  owner_name?: string;
  deadline_at?: string | null;
}): Promise<{ wishlist: Wishlist; editToken: string }> {
  if (isSupabaseConfigured()) return sbCreateWishlist(params);
  const body: Record<string, unknown> = {
    title: params.title,
    description: params.occasion ?? '',
    deadline_at: params.deadline_at != null && params.deadline_at !== '' ? params.deadline_at : undefined,
  };
  const data = await goApi<ApiWishlist | null>('/api/wishlists', { method: 'POST', body });
  if (!data || typeof data !== 'object') throw new Error('Неверный ответ сервера');
  return { wishlist: mapWishlist(data), editToken: '' };
}

export async function updateWishlist(
  wishlistId: string,
  patch: { title?: string; description?: string; deadline_at?: string | null }
): Promise<void> {
  if (isSupabaseConfigured()) {
    await sbUpdateWishlist(wishlistId, patch);
    return;
  }
  const body: Record<string, unknown> = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.deadline_at !== undefined) body.deadline_at = patch.deadline_at === '' || patch.deadline_at == null ? '' : patch.deadline_at;
  await goApi(`/api/wishlists/id/${wishlistId}`, { method: 'PUT', body });
}

export async function addWishlistItem(
  wishlistId: string,
  item: { title: string; url?: string; image_url?: string; price?: number; target_amount?: number }
): Promise<WishlistItem> {
  if (isSupabaseConfigured()) return sbAddWishlistItem(wishlistId, item);
  const priceCents =
    item.target_amount != null ? Math.round(item.target_amount * 100)
    : item.price != null ? Math.round(item.price * 100) : undefined;
  const data = await goApi<ApiWishlistItem>(`/api/wishlists/${wishlistId}/items`, {
    method: 'POST',
    body: { title: item.title, url: item.url ?? '', image_url: item.image_url ?? '', price_cents: priceCents ?? null },
  });
  return mapItem(data);
}

export async function updateWishlistItem(
  itemId: string,
  patch: Partial<Pick<WishlistItem, 'title' | 'url' | 'image_url' | 'price' | 'target_amount' | 'is_unavailable'>>
): Promise<void> {
  if (isSupabaseConfigured()) {
    await sbUpdateWishlistItem(itemId, patch);
    return;
  }
  const priceCents =
    patch.target_amount != null ? Math.round(patch.target_amount * 100)
    : patch.price != null ? Math.round(patch.price * 100) : undefined;
  await goApi(`/api/items/${itemId}`, {
    method: 'PUT',
    body: {
      title: patch.title,
      url: patch.url ?? '',
      image_url: patch.image_url ?? '',
      price_cents: priceCents ?? null,
    },
  });
}

export async function deleteWishlistItem(itemId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await sbDeleteWishlistItem(itemId);
    return;
  }
  await goApi(`/api/items/${itemId}`, { method: 'DELETE' });
}

export async function reserveItem(itemId: string, nickname: string): Promise<void> {
  if (isSupabaseConfigured()) return sbReserveItem(itemId, nickname);
  await goApi(`/api/items/${itemId}/reserve`, { method: 'POST', body: { participant_name: nickname } });
}

/** Снять резерв (только свой). Привязка к сессии: Go по user_id, Supabase по auth.uid(). */
export async function unreserveItem(itemId: string): Promise<void> {
  if (isSupabaseConfigured()) return sbUnreserveItem(itemId);
  await goApi(`/api/items/${itemId}/reserve`, { method: 'DELETE' });
}

export async function addContribution(itemId: string, amount: number, nickname: string): Promise<void> {
  if (isSupabaseConfigured()) return sbAddContribution(itemId, amount, nickname);
  await goApi(`/api/items/${itemId}/contribute`, {
    method: 'POST',
    body: { participant_name: nickname, amount_cents: Math.round(amount * 100) },
  });
}

export async function fetchMetaFromUrl(url: string): Promise<{ title?: string; image?: string; price?: number }> {
  if (isSupabaseConfigured()) return sbFetchMetaFromUrl(url);
  try {
    const data = await goApi<{ title?: string; image_url?: string; price_cents?: number }>('/api/scraper/fetch', { method: 'POST', body: { url } });
    return {
      title: data.title,
      image: data.image_url,
      price: data.price_cents != null ? data.price_cents / 100 : undefined,
    };
  } catch {
    return {};
  }
}

export function getWsUrl(slug: string): string {
  return getBase().replace(/^http/, 'ws') + `/api/ws/${slug}`;
}

/** При использовании Supabase Realtime можно не открывать WebSocket — см. useWishlist. */
export function useSupabaseRealtime(): boolean {
  return isSupabaseConfigured();
}

export async function reorderItems(wishlistId: string, itemIds: string[]): Promise<void> {
  if (isSupabaseConfigured()) return sbReorderItems(wishlistId, itemIds);
  await goApi(`/api/wishlists/${wishlistId}/items/order`, { method: 'PUT', body: { item_ids: itemIds } });
}

export async function addItemComment(itemId: string, participantName: string, body: string): Promise<ApiComment> {
  if (isSupabaseConfigured()) return sbAddItemComment(itemId, participantName, body);
  return goApi<ApiComment>(`/api/items/${itemId}/comments`, {
    method: 'POST',
    body: { participant_name: participantName, body: body.trim() },
  });
}

export async function getWishlistTemplates(): Promise<WishlistTemplate[]> {
  if (isSupabaseConfigured()) return sbGetWishlistTemplates();
  const data = await goApi<WishlistTemplate[] | null>('/api/wishlist-templates');
  return Array.isArray(data) ? data : [];
}
