import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim() || undefined);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container">
        <h1 className="page-title">Регистрация</h1>
        <form
          onSubmit={handleSubmit}
          className="card animate-in"
          style={{ padding: 28, maxWidth: 400 }}
        >
          <div style={{ marginBottom: 18 }}>
            <label className="label">Имя (необязательно)</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как к вам обращаться"
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="label">Email *</label>
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
            <label className="label">Пароль (минимум 6 символов) *</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p style={{ color: '#9a3b3b', marginBottom: 14, fontSize: '0.9rem' }}>{error}</p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !email.trim() || password.length < 6}
            >
              {loading ? 'Регистрация…' : 'Зарегистрироваться'}
            </button>
            <Link to="/" className="btn-ghost" style={{ alignSelf: 'center' }}>
              Назад
            </Link>
          </div>
          <p style={{ marginTop: 20, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </form>
      </div>
    </Layout>
  );
}
