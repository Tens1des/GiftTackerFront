import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../test/test-utils';
import { Layout } from './Layout';

vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      logout: vi.fn(),
    }),
  };
});

describe('Layout', () => {
  it('рендерит логотип и навигацию', () => {
    render(<Layout><span>Контент</span></Layout>);
    expect(screen.getByText('Вишлист')).toBeInTheDocument();
    expect(screen.getByText('Контент')).toBeInTheDocument();
  });

  it('без пользователя показывает Войти и Регистрация', () => {
    render(<Layout><div /></Layout>);
    expect(screen.getByRole('link', { name: /войти/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /регистрация/i })).toBeInTheDocument();
  });
});
