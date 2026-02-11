import { useEffect, useState, useCallback } from 'react';
import { getWishlistBySlug, getWsUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Wishlist, WishlistItem } from '../types';

export function useWishlist(slug: string | undefined) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const w = await getWishlistBySlug(slug);
      setWishlist(w ?? null);
      if (!w) setError('Список не найден');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      setWishlist(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      setWishlist(null);
      setLoading(false);
      setError(null);
      return;
    }
    fetchWishlist();
  }, [slug, fetchWishlist]);

  // WebSocket: при обновлении на бэке перезапрашиваем список
  useEffect(() => {
    if (!slug || !wishlist) return;
    const wsUrl = getWsUrl(slug);
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'wishlist_updated') fetchWishlist();
      } catch {
        // ignore
      }
    };
    return () => ws.close();
  }, [slug, wishlist?.id, fetchWishlist]);

  const isOwner = Boolean(user && wishlist && wishlist.owner_id && user.id === wishlist.owner_id);
  const items: WishlistItem[] = Array.isArray(wishlist?.items) ? wishlist.items : [];

  return {
    wishlist,
    items,
    loading,
    error,
    isOwner,
    refetch: fetchWishlist,
  };
}

// Оставлены для совместимости — данные уже в useWishlist
export function useWishlistItems(_wishlistId: string | null) {
  return { items: [], loading: false, refetch: () => {} };
}

export function useReservations(
  _itemIds: string[],
  _forOwner: boolean
): { reservations: { item_id: string; reserved_by_nickname: string }[]; reservedSet: Set<string> } {
  return { reservations: [], reservedSet: new Set() };
}

export function useContributions(
  _itemIds: string[],
  forOwner: boolean
): {
  contributions: { item_id: string; amount: number }[];
  totalByItem: Record<string, number>;
  forOwner: boolean;
} {
  return {
    contributions: [],
    totalByItem: {},
    forOwner,
  };
}
