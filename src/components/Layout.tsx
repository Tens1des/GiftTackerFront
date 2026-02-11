import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = (
    <>
      {user && (
        <Link to="/my" className="nav-link" onClick={() => setMobileOpen(false)}>
          Мои вишлисты
        </Link>
      )}
      {user ? (
        <>
          <span className="nav-user">{user.name || user.email}</span>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '8px 14px', fontSize: '0.9rem' }}
            onClick={() => { logout(); setMobileOpen(false); }}
          >
            Выйти
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="btn-ghost" onClick={() => setMobileOpen(false)}>Войти</Link>
          <Link to="/register" className="btn-primary" style={{ padding: '8px 16px' }} onClick={() => setMobileOpen(false)}>
            Регистрация
          </Link>
        </>
      )}
    </>
  );

  return (
    <div className="layout">
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <Link to="/" className="logo" onClick={() => setMobileOpen(false)}>
            <span className="logo-icon">🎁</span>
            Вишлист
          </Link>
          <nav className="nav-desktop">
            {navLinks}
          </nav>
          <button
            type="button"
            className="btn-icon nav-mobile-trigger"
            aria-label="Меню"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
          >
            <span className="nav-mobile-icon" aria-hidden>{mobileOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </header>
      {mobileOpen && (
        <nav className="nav-mobile">
          <button
            type="button"
            className="btn-icon nav-close"
            aria-label="Закрыть"
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
          <Link to="/" className="logo" style={{ fontSize: '1.2rem' }} onClick={() => setMobileOpen(false)}>
            🎁 Вишлист
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {navLinks}
          </div>
        </nav>
      )}
      <main className="main">{children}</main>
    </div>
  );
}
