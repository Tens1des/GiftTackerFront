import { useState } from 'react';
import { fetchMetaFromUrl } from '../lib/api';

interface AddItemFormProps {
  onSubmit: (item: {
    title: string;
    url?: string;
    image_url?: string;
    price?: number;
    target_amount?: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export function AddItemForm({ onSubmit, onCancel }: AddItemFormProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);

  const handleFetchUrl = async () => {
    const u = url.trim();
    if (!u) return;
    setFetchingUrl(true);
    try {
      const meta = await fetchMetaFromUrl(u);
      if (meta.title) setTitle(meta.title);
      if (meta.image) setImageUrl(meta.image);
      if (meta.price != null) setPrice(String(meta.price));
    } catch {
      // ignore
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setLoading(true);
    try {
      await onSubmit({
        title: t,
        url: url.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        price: price ? parseFloat(price.replace(',', '.')) : undefined,
        target_amount: targetAmount ? parseFloat(targetAmount.replace(',', '.')) : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card animate-in" style={{ padding: 24 }}>
      <h3 style={{ marginTop: 0, marginBottom: 20 }}>Новый подарок</h3>
      <div style={{ marginBottom: 14 }}>
        <label className="label">Ссылка на товар (автозаполнение)</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="url"
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            style={{ flex: 1, minWidth: 200 }}
          />
          <button type="button" className="btn-secondary" onClick={handleFetchUrl} disabled={fetchingUrl || !url.trim()}>
            {fetchingUrl ? 'Загрузка…' : 'Подтянуть'}
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="label">Название *</label>
        <input
          type="text"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Например: Наушники беспроводные"
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="label">Ссылка на картинку</label>
        <input
          type="url"
          className="input"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label className="label">Цена (₽)</label>
          <input
            type="text"
            inputMode="decimal"
            className="input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
          />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label className="label">Сбор с друзей (₽)</label>
          <input
            type="text"
            inputMode="decimal"
            className="input"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="Пусто = один подарок"
          />
          <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Если указать — друзья смогут скидываться
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn-primary" disabled={loading || !title.trim()}>
          {loading ? 'Добавляю…' : 'Добавить'}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  );
}
