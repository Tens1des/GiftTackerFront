import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../test/test-utils';
import { WishlistView } from './WishlistView';

const mockUseWishlist = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ slug: 'test-slug' }),
  };
});

vi.mock('../hooks/useWishlist', () => ({
  useWishlist: (slug: string | undefined) => mockUseWishlist(slug),
}));

describe('WishlistView', () => {
  beforeEach(() => {
    mockUseWishlist.mockReturnValue({
      wishlist: {
        id: 'w1',
        slug: 'test-slug',
        title: 'Тестовый список',
        occasion: 'Праздник',
        owner_name: 'Я',
        deadline_at: null,
      },
      items: [],
      loading: false,
      error: null,
      isOwner: false,
      refetch: vi.fn(),
    });
  });

  it('рендерит заголовок списка', async () => {
    render(<WishlistView />);
    expect(await screen.findByRole('heading', { name: /тестовый список/i })).toBeInTheDocument();
  });

  it('показывает повод списка', () => {
    render(<WishlistView />);
    expect(screen.getByText(/праздник/i)).toBeInTheDocument();
  });

  it('при loading показывает скелетон (контейнер загрузки)', () => {
    mockUseWishlist.mockReturnValue({
      wishlist: null,
      items: [],
      loading: true,
      error: null,
      isOwner: false,
      refetch: vi.fn(),
    });
    const { container } = render(<WishlistView />);
    expect(container.querySelector('.container')).toBeInTheDocument();
  });

  it('при ошибке показывает «Список не найден»', () => {
    mockUseWishlist.mockReturnValue({
      wishlist: null,
      items: [],
      loading: false,
      error: 'Ошибка',
      isOwner: false,
      refetch: vi.fn(),
    });
    render(<WishlistView />);
    expect(screen.getByText(/список не найден/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /на главную/i })).toBeInTheDocument();
  });
});
