import { useEffect, useState, useCallback } from 'react';
import { getWishlistBySlug, getWsUrl, useSupabaseRealtime } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Wishlist, WishlistItem } from '../types';

const WS_RECONNECT_INITIAL_MS = 1000;
const WS_RECONNECT_MAX_MS = 30000;
const WS_RECONNECT_BACKOFF = 1.5;

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

  // Обновления в реальном времени: Supabase Realtime или WebSocket (Go) с реконнектом
  useEffect(() => {
    if (!slug || !wishlist) return;

    if (useSupabaseRealtime() && supabase != null) {
      const client = supabase;
      let channel = client
        .channel(`wishlist:${wishlist.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wishlist_items', filter: `wishlist_id=eq.${wishlist.id}` },
          () => fetchWishlist()
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            client.removeChannel(channel);
            channel = client
              .channel(`wishlist:${wishlist.id}`)
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'wishlist_items', filter: `wishlist_id=eq.${wishlist.id}` },
                () => fetchWishlist()
              )
              .subscribe();
          }
        });
      return () => {
        client.removeChannel(channel);
      };
    }

    const wsUrl = getWsUrl(slug);
    let ws: WebSocket | null = null;
    let reconnectDelay = WS_RECONNECT_INITIAL_MS;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    function connect() {
      if (!mounted) return;
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        reconnectDelay = WS_RECONNECT_INITIAL_MS;
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'wishlist_updated') fetchWishlist();
        } catch {
          // ignore
        }
      };
      ws.onclose = () => {
        ws = null;
        if (!mounted) return;
        timeoutId = setTimeout(() => {
          connect();
          reconnectDelay = Math.min(Math.floor(reconnectDelay * WS_RECONNECT_BACKOFF), WS_RECONNECT_MAX_MS);
        }, reconnectDelay);
      };
      ws.onerror = () => {
        // onclose вызовется следом — реконнект там
      };
    }

    connect();
    return () => {
      mounted = false;
      if (timeoutId != null) clearTimeout(timeoutId);
      if (ws) ws.close();
    };
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
