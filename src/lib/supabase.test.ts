import { describe, it, expect } from 'vitest';
import { isSupabaseConfigured, supabase } from './supabase';

describe('supabase', () => {
  it('isSupabaseConfigured возвращает boolean', () => {
    expect(typeof isSupabaseConfigured()).toBe('boolean');
  });

  it('supabase либо клиент, либо null', () => {
    expect(supabase === null || typeof supabase?.auth === 'object').toBe(true);
  });
});
