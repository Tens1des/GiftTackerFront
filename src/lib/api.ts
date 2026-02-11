/**
 * API клиент для бэкенда (Go), не Supabase.
 * Базовый URL задаётся в VITE_API_URL (например http://localhost:8081).
 * JWT после логина/регистрации сохраняется и передаётся в заголовке (cross-origin надёжнее куки).
 */

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

async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { body, ...rest } = opts;
  const method = rest.method ?? 'GET';
  const url = getBase() + path;
  const headers: Record<string, string> = {
    ...(rest.headers as Record<string, string>),
  };
  if (body != null && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...rest,
    method,
    headers,
    credentials: 'include',
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Типы ответов бэкенда
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
    total_contributed_cents: a.total_contributed_cents,
    target_cents: a.target_cents,
    comments: a.comments ?? [],
  } as WishlistItem;
}

function mapWishlist(a: ApiWishlist): Wishlist {
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
    items: (a.items ?? []).map(mapItem),
  };
}

export async function getMe(): Promise<ApiUser | null> {
  try {
    return await api<ApiUser>('/api/auth/me');
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<ApiUser> {
  const res = await api<{ user: ApiUser; token?: string }>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (res.token) setStoredToken(res.token);
  return res.user;
}

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<ApiUser> {
  const res = await api<{ user: ApiUser; token?: string }>('/api/auth/register', {
    method: 'POST',
    body: { email, password, name: name || '' },
  });
  if (res.token) setStoredToken(res.token);
  return res.user;
}

export async function logout(): Promise<void> {
  setStoredToken(null);
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } catch {
    // уже вышли или сеть — не мешаем сбросу на фронте
  }
}

/** Список вишлистов пользователя (без items) */
export interface ApiWishlistShort {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export async function getMyWishlists(): Promise<Wishlist[]> {
  const list = await api<ApiWishlistShort[]>('/api/wishlists');
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
  try {
    const data = await api<ApiWishlist>(`/api/wishlists/slug/${slug}`);
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
  const body: Record<string, unknown> = {
    title: params.title,
    description: params.occasion ?? '',
    slug: undefined,
  };
  if (params.deadline_at != null && params.deadline_at !== '') {
    body.deadline_at = params.deadline_at;
  }
  const data = await api<ApiWishlist>('/api/wishlists', {
    method: 'POST',
    body,
  });
  const wishlist = mapWishlist(data);
  return { wishlist, editToken: '' };
}

export async function updateWishlist(
  wishlistId: string,
  patch: { title?: string; description?: string; deadline_at?: string | null }
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.deadline_at !== undefined) body.deadline_at = patch.deadline_at === '' || patch.deadline_at == null ? '' : patch.deadline_at;
  await api(`/api/wishlists/id/${wishlistId}`, {
    method: 'PUT',
    body,
  });
}

export async function addWishlistItem(
  wishlistId: string,
  item: {
    title: string;
    url?: string;
    image_url?: string;
    price?: number;
    target_amount?: number;
  }
): Promise<WishlistItem> {
  const priceCents =
    item.target_amount != null
      ? Math.round((item.target_amount || 0) * 100)
      : item.price != null
        ? Math.round(item.price * 100)
        : undefined;
  const data = await api<ApiWishlistItem>(
    `/api/wishlists/${wishlistId}/items`,
    {
      method: 'POST',
      body: {
        title: item.title,
        url: item.url ?? '',
        image_url: item.image_url ?? '',
        price_cents: priceCents ?? null,
      },
    }
  );
  return mapItem(data);
}

export async function updateWishlistItem(
  itemId: string,
  patch: Partial<Pick<WishlistItem, 'title' | 'url' | 'image_url' | 'price' | 'target_amount' | 'is_unavailable'>>
): Promise<void> {
  const priceCents =
    patch.target_amount != null
      ? Math.round(patch.target_amount * 100)
      : patch.price != null
        ? Math.round(patch.price * 100)
        : undefined;
  await api(`/api/items/${itemId}`, {
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
  await api(`/api/items/${itemId}`, { method: 'DELETE' });
}

export async function reserveItem(itemId: string, nickname: string): Promise<void> {
  await api(`/api/items/${itemId}/reserve`, {
    method: 'POST',
    body: { participant_name: nickname },
  });
}

export async function unreserveItem(itemId: string, nickname: string): Promise<void> {
  await api(`/api/items/${itemId}/reserve`, {
    method: 'DELETE',
    body: { participant_name: nickname },
  });
}

export async function addContribution(
  itemId: string,
  amount: number,
  nickname: string
): Promise<void> {
  await api(`/api/items/${itemId}/contribute`, {
    method: 'POST',
    body: {
      participant_name: nickname,
      amount_cents: Math.round(amount * 100),
    },
  });
}

export async function fetchMetaFromUrl(
  url: string
): Promise<{ title?: string; image?: string; price?: number }> {
  try {
    const data = await api<{ title?: string; image_url?: string; price_cents?: number }>(
      '/api/scraper/fetch',
      { method: 'POST', body: { url } }
    );
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
  const base = getBase().replace(/^http/, 'ws');
  return `${base}/api/ws/${slug}`;
}

export async function reorderItems(wishlistId: string, itemIds: string[]): Promise<void> {
  await api(`/api/wishlists/${wishlistId}/items/order`, {
    method: 'PUT',
    body: { item_ids: itemIds },
  });
}

export async function addItemComment(
  itemId: string,
  participantName: string,
  body: string
): Promise<ApiComment> {
  return api<ApiComment>(`/api/items/${itemId}/comments`, {
    method: 'POST',
    body: { participant_name: participantName, body: body.trim() },
  });
}

export interface WishlistTemplate {
  slug: string;
  title: string;
  description: string;
  example_items: string[];
}

export async function getWishlistTemplates(): Promise<WishlistTemplate[]> {
  return api<WishlistTemplate[]>('/api/wishlist-templates');
}
