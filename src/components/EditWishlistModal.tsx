import { useState, useEffect } from 'react';
import type { Wishlist } from '../types';

interface EditWishlistModalProps {
  wishlist: Wishlist;
  onSave: (patch: { title: string; description: string; deadline_at: string | null }) => Promise<void>;
  onClose: () => void;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function EditWishlistModal({ wishlist, onSave, onClose }: EditWishlistModalProps) {
  const [title, setTitle] = useState(wishlist.title);
  const [description, setDescription] = useState(wishlist.occasion ?? '');
  const [deadlineAt, setDeadlineAt] = useState(toDateInputValue(wishlist.deadline_at));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(wishlist.title);
    setDescription(wishlist.occasion ?? '');
    setDeadlineAt(toDateInputValue(wishlist.deadline_at));
  }, [wishlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        deadline_at: deadlineAt.trim() ? deadlineAt.trim() : null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, width: '100%', padding: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Настройки списка</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Название списка *</label>
            <input type="text" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Повод / описание</label>
            <input type="text" className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="День рождения Маши" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="label">Активен до (дата)</label>
            <input
              type="date"
              className="input"
              value={deadlineAt}
              onChange={(e) => setDeadlineAt(e.target.value)}
            />
            <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Оставьте пустым, чтобы список был без срока
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-primary" disabled={loading || !title.trim()}>
              {loading ? 'Сохраняю…' : 'Сохранить'}
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
