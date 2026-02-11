import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function Home() {
  const { user, loading } = useAuth();
  const hasBackend = Boolean(API_BASE || typeof window !== 'undefined');

  return (
    <Layout>
      <div className="container">
        {!hasBackend && (
          <div
            className="card animate-in"
            style={{
              padding: '14px 18px',
              marginBottom: '24px',
              background: 'var(--accent-soft)',
              borderColor: 'var(--accent)',
              color: 'var(--accent-hover)',
            }}
          >
            Задайте <code>.env</code>: <code>VITE_API_URL=http://localhost:8081</code> (адрес бэкенда).
          </div>
        )}
        <section className="hero card animate-in" style={{ padding: '56px 28px', textAlign: 'center', marginBottom: 48, background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(252,232,224,0.4) 100%)', border: '1px solid rgba(232,226,220,0.8)' }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.85rem, 4.5vw, 2.75rem)', marginBottom: 16, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Списки желаний для друзей
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 36, maxWidth: 420, margin: '0 auto 36px', fontSize: '1.08rem', lineHeight: 1.6 }}>
            Создайте вишлист к празднику, добавьте подарки и поделитесь ссылкой. Друзья смогут зарезервировать подарок
            или скинуться на крупный — без дублей и испорченных сюрпризов.
          </p>
          {!loading && (
            <div className="hero-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              {user ? (
                <>
                  <Link to="/my" className="btn-secondary" style={{ padding: '14px 28px' }}>
                    Мои вишлисты
                  </Link>
                  <Link to="/new" className="btn-primary" style={{ padding: '14px 28px' }}>
                    Создать вишлист
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-primary" style={{ padding: '14px 28px' }}>
                    Войти
                  </Link>
                  <Link to="/register" className="btn-secondary" style={{ padding: '14px 28px' }}>
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          )}
          {!loading && !user && (
            <p style={{ marginTop: 20, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Чтобы создать вишлист, войдите или зарегистрируйтесь
            </p>
          )}
        </section>

        <section className="features animate-in animate-in-delay-1" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: 20, color: 'var(--text-muted)', fontWeight: 600 }}>
            Как это работает
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { emoji: '📝', title: 'Создайте список', text: 'Название, повод и подарки с ссылками и ценами' },
              { emoji: '🔗', title: 'Поделитесь ссылкой', text: 'Друзья открывают список без регистрации' },
              { emoji: '🎯', title: 'Резерв и скиды', text: 'Один резервирует подарок, несколько могут скинуться на дорогой' },
              { emoji: '🎁', title: 'Сюрприз сохранён', text: 'Владелец не видит, кто что выбрал' },
            ].map((f, i) => (
              <li key={i} className={`card card-hover animate-in animate-in-delay-${i + 1}`} style={{ padding: '22px 24px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <span className="feature-emoji" style={{ fontSize: '1.9rem', lineHeight: 1 }}>{f.emoji}</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4 }}>{f.title}</strong>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{f.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Уже есть ссылка? Вставьте в адресную строку:{' '}
          <code style={{ background: 'var(--border)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>/w/ваш-код</code>
        </p>
      </div>
    </Layout>
  );
}
