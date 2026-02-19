import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test/test-utils';
import { CreateWishlist } from './CreateWishlist';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'user-1', email: 'u@u.com', name: 'User' },
      loading: false,
    }),
  };
});

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return {
    ...actual,
    createWishlist: vi.fn().mockResolvedValue({
      wishlist: { id: 'w1', slug: 'my-list', title: 'Мой список' },
    }),
    getWishlistTemplates: vi.fn().mockResolvedValue([]),
  };
});

describe('CreateWishlist', () => {
  it('рендерит заголовок и форму создания', () => {
    render(<CreateWishlist />);
    expect(screen.getByRole('heading', { name: /новый вишлист/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/название списка/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /создать/i })).toBeInTheDocument();
  });

  it('кнопка «Создать» активна при заполненном названии', async () => {
    const user = userEvent.setup();
    render(<CreateWishlist />);
    const titleInput = screen.getByRole('textbox', { name: /название списка/i });
    await user.type(titleInput, 'ДР');
    expect(screen.getByRole('button', { name: /создать/i })).not.toBeDisabled();
  });
});
