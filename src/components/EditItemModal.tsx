import { useState, useEffect } from 'react';
import type { WishlistItem } from '../types';

interface EditItemModalProps {
  item: WishlistItem;
  onSave: (patch: Partial<WishlistItem>) => Promise<void>;
  onClose: () => void;
}

export function EditItemModal({ item, onSave, onClose }: EditItemModalProps) {
  const [title, setTitle] = useState(item.title);
  const [url, setUrl] = useState(item.url ?? '');
  const [imageUrl, setImageUrl] = useState(item.image_url ?? '');
  const [price, setPrice] = useState(item.price != null ? String(item.price) : '');
  const [targetAmount, setTargetAmount] = useState(
    item.target_amount != null ? String(item.target_amount) : ''
  );
  const [isUnavailable, setIsUnavailable] = useState(item.is_unavailable);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(item.title);
    setUrl(item.url ?? '');
    setImageUrl(item.image_url ?? '');
    setPrice(item.price != null ? String(item.price) : '');
    setTargetAmount(item.target_amount != null ? String(item.target_amount) : '');
    setIsUnavailable(item.is_unavailable);
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        url: url.trim() || null,
        image_url: imageUrl.trim() || null,
        price: price ? parseFloat(price.replace(',', '.')) : null,
        target_amount: targetAmount ? parseFloat(targetAmount.replace(',', '.')) : null,
        is_unavailable: isUnavailable,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, width: '100%', padding: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Редактировать подарок</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Название *</label>
            <input type="text" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Ссылка</label>
            <input type="url" className="input" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Картинка (URL)</label>
            <input type="url" className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={isUnavailable} onChange={(e) => setIsUnavailable(e.target.checked)} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Товар недоступен (ссылка битая или снят с продажи)
              </span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Цена (₽)</label>
              <input type="text" inputMode="decimal" className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Сбор (₽)</label>
              <input
                type="text"
                inputMode="decimal"
                className="input"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Пусто = один подарок"
              />
            </div>
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
