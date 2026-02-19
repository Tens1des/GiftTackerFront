import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test/test-utils';
import { Register } from './Register';

const mockRegister = vi.fn();
vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      register: mockRegister,
      logout: vi.fn(),
    }),
  };
});

describe('Register', () => {
  it('рендерит форму регистрации', () => {
    render(<Register />);
    expect(screen.getByRole('heading', { name: /регистрация/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/имя/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль.*минимум/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /зарегистрироваться/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /войти/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('при ошибке регистрации показывает сообщение', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Email уже занят'));
    const user = userEvent.setup();
    render(<Register />);
    await user.type(screen.getByLabelText(/email \*/i), 'test@test.com');
    await user.type(screen.getByLabelText(/пароль.*минимум/i), '123456');
    await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }));
    expect(await screen.findByText(/email уже занят/i)).toBeInTheDocument();
  });
});
