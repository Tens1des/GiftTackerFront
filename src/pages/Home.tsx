import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function Home() {
  const { user, loading } = useAuth();
  const hasBackend = isSupabaseConfigured() || Boolean(API_BASE);

  return (
    <Layout>
      <div className="container">
        {!hasBackend && (
          <div className="card animate-in alert-env">
            Задайте в <code>.env</code>: <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_ANON_KEY</code> (Supabase) или <code>VITE_API_URL=http://localhost:8081</code> (Go-бэкенд).
          </div>
        )}
        <section className="hero card animate-in">
          <h1 className="hero-title">Списки желаний для друзей</h1>
          <p className="hero-desc">
            Создайте вишлист к празднику, добавьте подарки и поделитесь ссылкой. Друзья смогут зарезервировать подарок
            или скинуться на крупный — без дублей и испорченных сюрпризов.
          </p>
          {!loading && (
            <div className="hero-actions">
              {user ? (
                <>
                  <Link to="/my" className="btn-secondary">Мои вишлисты</Link>
                  <Link to="/new" className="btn-primary">Создать вишлист</Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-primary">Войти</Link>
                  <Link to="/register" className="btn-secondary">Регистрация</Link>
                </>
              )}
            </div>
          )}
          {!loading && !user && (
            <p className="hero-hint">Чтобы создать вишлист, войдите или зарегистрируйтесь</p>
          )}
        </section>

        <section className="features animate-in animate-in-delay-1">
          <h2 className="features-title">Как это работает</h2>
          <ul className="features-list">
            {[
              { emoji: '📝', title: 'Создайте список', text: 'Название, повод и подарки с ссылками и ценами' },
              { emoji: '🔗', title: 'Поделитесь ссылкой', text: 'Друзья открывают список без регистрации' },
              { emoji: '🎯', title: 'Резерв и скиды', text: 'Один резервирует подарок, несколько могут скинуться на дорогой' },
              { emoji: '🎁', title: 'Сюрприз сохранён', text: 'Владелец не видит, кто что выбрал' },
            ].map((f, i) => (
              <li key={i} className={`card card-hover animate-in animate-in-delay-${i + 1} feature-item`}>
                <span className="feature-emoji">{f.emoji}</span>
                <div>
                  <strong className="feature-title">{f.title}</strong>
                  <span className="feature-text">{f.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <p className="page-footer-hint">
          Уже есть ссылка? Вставьте в адресную строку:{' '}
          <code className="code-inline">/w/ваш-код</code>
        </p>
      </div>
    </Layout>
  );
}
