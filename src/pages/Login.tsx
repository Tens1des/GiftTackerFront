import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') ?? '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container">
        <h1 className="page-title animate-in">Вход</h1>
        <form onSubmit={handleSubmit} className="card animate-in animate-in-delay-1" style={{ padding: 28, maxWidth: 400 }}>
          <div style={{ marginBottom: 18 }}>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label className="label">Пароль</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p style={{ color: '#9a3b3b', marginBottom: 14, fontSize: '0.9rem' }}>{error}</p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !email.trim() || !password}
            >
              {loading ? 'Вход…' : 'Войти'}
            </button>
            <Link to="/" className="btn-ghost" style={{ alignSelf: 'center' }}>
              Назад
            </Link>
          </div>
          <p style={{ marginTop: 20, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </form>
      </div>
    </Layout>
  );
}
