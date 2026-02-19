import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDeadline, formatCommentDate, isDeadlinePast } from './dateUtils';

describe('dateUtils', () => {
  describe('formatDeadline', () => {
    it('форматирует ISO дату по-русски (содержит день и год)', () => {
      const s = formatDeadline('2025-12-31T00:00:00Z');
      expect(s).toMatch(/\d{1,2}/);
      expect(s).toContain('2025');
    });
  });

  describe('formatCommentDate', () => {
    it('возвращает короткий формат с точками', () => {
      const s = formatCommentDate('2025-03-12T10:00:00Z');
      expect(s).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });
  });

  describe('isDeadlinePast', () => {
    const now = new Date('2025-06-15T12:00:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('возвращает false для null/undefined', () => {
      expect(isDeadlinePast(null)).toBe(false);
      expect(isDeadlinePast(undefined)).toBe(false);
    });

    it('возвращает true если дата в прошлом', () => {
      expect(isDeadlinePast('2025-01-01T00:00:00Z')).toBe(true);
    });

    it('возвращает false если дата в будущем', () => {
      expect(isDeadlinePast('2025-12-31T23:59:59Z')).toBe(false);
    });
  });
});
