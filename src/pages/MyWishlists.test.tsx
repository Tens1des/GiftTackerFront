import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../test/test-utils';
import { MyWishlists } from './MyWishlists';

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

const mockGetMyWishlists = vi.fn();
vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return {
    ...actual,
    getMyWishlists: (...args: unknown[]) => mockGetMyWishlists(...args),
  };
});

describe('MyWishlists', () => {
  beforeEach(() => {
    mockGetMyWishlists.mockClear();
  });

  it('рендерит заголовок «Мои вишлисты»', async () => {
    mockGetMyWishlists.mockResolvedValue([]);
    render(<MyWishlists />);
    expect(await screen.findByRole('heading', { name: /мои вишлисты/i })).toBeInTheDocument();
  });

  it('при пустом списке показывает призыв создать первый', async () => {
    mockGetMyWishlists.mockResolvedValue([]);
    render(<MyWishlists />);
    expect(await screen.findByText(/у вас пока нет вишлистов/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /создать первый/i })).toBeInTheDocument();
  });

  it('при наличии списка показывает вишлисты и ссылку «Новый вишлист»', async () => {
    mockGetMyWishlists.mockResolvedValue([
      { id: 'w1', slug: 'dr', title: 'День рождения', occasion: 'Маше', owner_id: 'user-1' },
    ]);
    render(<MyWishlists />);
    expect(await screen.findByText('День рождения')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /новый вишлист/i })).toBeInTheDocument();
  });
});
