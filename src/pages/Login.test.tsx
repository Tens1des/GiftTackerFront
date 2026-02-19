import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test/test-utils';
import { Login } from './Login';

const mockLogin = vi.fn();
vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      login: mockLogin,
      logout: vi.fn(),
    }),
  };
});

describe('Login', () => {
  it('рендерит форму входа', () => {
    render(<Login />);
    expect(screen.getByRole('heading', { name: /вход/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /зарегистрироваться/i })).toBeInTheDocument();
  });

  it('при ошибке логина показывает сообщение', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Неверный пароль'));
    const user = userEvent.setup();
    render(<Login />);
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/пароль/i), 'pass');
    await user.click(screen.getByRole('button', { name: /войти/i }));
    expect(await screen.findByText(/неверный пароль/i)).toBeInTheDocument();
  });
});
