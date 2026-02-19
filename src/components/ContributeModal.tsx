import { useState } from 'react';
import type { WishlistItem } from '../types';

interface ContributeModalProps {
  item: WishlistItem;
  currentTotal: number;
  onConfirm: (amount: number, nickname: string) => void | Promise<void>;
  onClose: () => void;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' ₽';
}

export function ContributeModal({ item, currentTotal, onConfirm, onClose }: ContributeModalProps) {
  const [amount, setAmount] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const target = item.target_amount ?? 0;
  const remaining = Math.max(0, target - currentTotal);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const a = parseFloat(amount.replace(',', '.').replace(/\s/g, ''));
    const n = nickname.trim();
    if (!n || !Number.isFinite(a) || a <= 0) return;
    if (remaining > 0 && a > remaining) {
      setSubmitError(`Сумма не должна превышать оставшуюся сумму (${formatPrice(remaining)})`);
      return;
    }
    setLoading(true);
    try {
      await Promise.resolve(onConfirm(a, n));
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, width: '100%', padding: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Скинуться на: {item.title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
          Собрано {formatPrice(currentTotal)} из {formatPrice(target)}. Осталось {formatPrice(remaining)}.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Владелец списка не увидит, кто сколько внёс — только общую сумму.
        </p>
        {submitError && (
          <p style={{ color: '#9a3b3b', fontSize: '0.9rem', marginBottom: 12 }}>{submitError}</p>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Сумма (₽)
            </label>
            <input
              type="text"
              inputMode="decimal"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              required
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Как к вам обращаться?
            </label>
            <input
              type="text"
              className="input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ваше имя"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={
                loading ||
                !nickname.trim() ||
                !amount.trim() ||
                remaining <= 0 ||
                (() => {
                  const a = parseFloat(amount.replace(',', '.').replace(/\s/g, ''));
                  return !Number.isFinite(a) || a <= 0 || a > remaining;
                })()
              }
            >
              Внести вклад
            </button>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
