import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { getMyWishlists } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { SkeletonWishlistList } from '../components/Skeleton';
import type { Wishlist } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function MyWishlists() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [list, setList] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?next=/my');
      return;
    }
    if (!user) return;
    setLoading(true);
    setError(null);
    getMyWishlists()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const copyViewLink = (slug: string) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/w/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Ссылка скопирована');
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

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <Layout>
      <div className="container">
        <h1 className="page-title">Мои вишлисты</h1>
        {error && (
          <p style={{ color: '#9a3b3b', marginBottom: 16 }}>{error}</p>
        )}
        {loading ? (
          <SkeletonWishlistList count={4} />
        ) : list.length === 0 ? (
          <div className="card animate-in" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '1.05rem' }}>
              У вас пока нет вишлистов.
            </p>
            <Link to="/new" className="btn-primary" style={{ padding: '14px 24px' }}>
              Создать первый
            </Link>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {list.map((w, i) => (
              <li key={w.id} className={`animate-in animate-in-delay-${Math.min(i + 1, 6)}`} style={{ marginBottom: 14 }}>
                <div className="card card-hover" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <Link
                        to={`/w/${w.slug}/edit`}
                        style={{
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          color: 'inherit',
                          textDecoration: 'none',
                        }}
                      >
                        {w.title}
                      </Link>
                      {w.occasion && (
                        <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          {w.occasion}
                        </p>
                      )}
                      <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {baseUrl}/w/{w.slug}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.9rem' }}
                        onClick={() => copyViewLink(w.slug)}
                      >
                        Копировать ссылку
                      </button>
                      <Link to={`/w/${w.slug}/edit`} className="btn-primary" style={{ fontSize: '0.9rem', padding: '10px 18px' }}>
                        Открыть
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p style={{ marginTop: 28 }}>
          <Link to="/new" className="btn-primary">
            + Новый вишлист
          </Link>
        </p>
      </div>
    </Layout>
  );
}
