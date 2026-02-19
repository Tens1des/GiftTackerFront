import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../test/test-utils';
import { Home } from './Home';

vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      loading: false,
    }),
  };
});

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: () => false,
}));

describe('Home', () => {
  it('рендерит заголовок и призыв', () => {
    render(<Home />);
    expect(screen.getByText(/списки желаний/i)).toBeInTheDocument();
    expect(screen.getByText(/создайте вишлист/i)).toBeInTheDocument();
  });

  it('без пользователя показывает ссылки Войти и Регистрация', () => {
    render(<Home />);
    const loginLinks = screen.getAllByRole('link', { name: /войти/i });
    const registerLinks = screen.getAllByRole('link', { name: /регистрация/i });
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    expect(registerLinks.length).toBeGreaterThanOrEqual(1);
  });
});
