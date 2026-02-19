import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from './api';

vi.mock('./supabase', () => ({
  supabase: null,
  isSupabaseConfigured: vi.fn(() => false),
}));

describe('api (Go fallback)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve('') }));
  });

  it('getMe возвращает null при ошибке/без бэкенда', async () => {
    const result = await api.getMe();
    expect(result).toBeNull();
  });

  it('getWishlistTemplates возвращает массив', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    }));
    const result = await api.getWishlistTemplates();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });
});
