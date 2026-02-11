import { useState } from 'react';
import type { WishlistItem } from '../types';

interface CommentModalProps {
  item: WishlistItem;
  defaultName?: string;
  onSubmit: (participantName: string, body: string) => Promise<void>;
  onClose: () => void;
}

export function CommentModal({ item, defaultName = '', onSubmit, onClose }: CommentModalProps) {
  const [name, setName] = useState(defaultName);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const b = body.trim();
    if (!n || !b) return;
    setLoading(true);
    try {
      await onSubmit(n, b);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, width: '100%', padding: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Комментарий к: {item.title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
          Владелец списка не увидит ваше имя — только текст и дату.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Как к вам обращаться?</label>
            <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" required />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="label">Комментарий *</label>
            <textarea
              className="input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Например: Возьму на себя"
              required
              rows={3}
              style={{ resize: 'vertical', minHeight: 80 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim() || !body.trim()}>
              {loading ? 'Отправляю…' : 'Отправить'}
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
