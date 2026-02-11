import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { createWishlist, getWishlistTemplates, type WishlistTemplate } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function CreateWishlist() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [occasion, setOccasion] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [deadlineAt, setDeadlineAt] = useState('');
  const [templates, setTemplates] = useState<WishlistTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?next=/new');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    getWishlistTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  const applyTemplate = (t: WishlistTemplate) => {
    setTitle(t.title);
    setOccasion(t.description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const { wishlist } = await createWishlist({
        title: t,
        occasion: occasion.trim() || undefined,
        owner_name: ownerName.trim() || undefined,
        deadline_at: deadlineAt.trim() || undefined,
      });
      navigate(`/w/${wishlist.slug}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <Layout>
        <div className="container">
          <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <h1 className="page-title">Новый вишлист</h1>

        {templates.length > 0 && (
          <div className="card animate-in" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 12, color: 'var(--text-muted)' }}>Выберите шаблон</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {templates.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.9rem' }}
                  onClick={() => applyTemplate(t)}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card animate-in" style={{ padding: 28, maxWidth: 480 }}>
          <div style={{ marginBottom: 18 }}>
            <label className="label">Название списка *</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="День рождения, Новый год…"
              required
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="label">Повод (необязательно)</label>
            <input
              type="text"
              className="input"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="День рождения Маши"
            />
          </div>
          <div style={{ marginBottom: 18 }}>
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
          <div style={{ marginBottom: 22 }}>
            <label className="label">Ваше имя (увидят друзья)</label>
            <input
              type="text"
              className="input"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Маша"
            />
          </div>
          {error && (
            <p style={{ color: '#9a3b3b', marginBottom: 14, fontSize: '0.9rem' }}>{error}</p>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading || !title.trim()}>
              {loading ? 'Создаю…' : 'Создать'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => navigate('/')}>
              Назад
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
