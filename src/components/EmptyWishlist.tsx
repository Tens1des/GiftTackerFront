interface EmptyWishlistProps {
  isOwner: boolean;
  onAddFirst?: () => void;
}

export function EmptyWishlist({ isOwner, onAddFirst }: EmptyWishlistProps) {
  return (
    <div className="empty-wishlist card animate-in" style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div className="empty-wishlist-icon" style={{ fontSize: '4rem', marginBottom: '16px', lineHeight: 1 }}>
        🧾
      </div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.35rem', marginBottom: '8px' }}>
        {isOwner ? 'Пока здесь пусто' : 'В этом списке пока нет подарков'}
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '320px', margin: '0 auto 24px' }}>
        {isOwner
          ? 'Добавьте первый подарок — название, ссылку, цену и картинку. Друзья смогут зарезервировать подарок или скинуться на крупный.'
          : 'Скоро здесь появятся желания. Сохраните ссылку и загляните позже.'}
      </p>
      {isOwner && onAddFirst && (
        <button type="button" className="btn-primary" onClick={onAddFirst}>
          Добавить подарок
        </button>
      )}
    </div>
  );
}
