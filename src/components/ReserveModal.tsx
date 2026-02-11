import { useState } from 'react';
import type { WishlistItem } from '../types';

interface ReserveModalProps {
  item: WishlistItem;
  onConfirm: (nickname: string) => void | Promise<void>;
  onClose: () => void;
}

export function ReserveModal({ item, onConfirm, onClose }: ReserveModalProps) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = nickname.trim();
    if (!n) return;
    setLoading(true);
    try {
      await Promise.resolve(onConfirm(n));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, width: '100%', padding: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Я подарю: {item.title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
          Как к вам обращаться? Имя не увидит владелец списка — только то, что подарок уже зарезервирован.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Ваше имя или ник"
            required
            autoFocus
            style={{ marginBottom: 16 }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn-primary" disabled={loading || !nickname.trim()}>
              Зарезервировать
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
