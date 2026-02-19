import { useState } from 'react';
import type { WishlistItem } from '../types';
import { formatCommentDate } from '../lib/dateUtils';

interface ItemCardProps {
  item: WishlistItem;
  isOwner: boolean;
  isReserved: boolean;
  reservedBy?: string;
  totalContributed: number;
  onReserve?: (item: WishlistItem) => void;
  onContribute?: (item: WishlistItem) => void;
  onUnreserve?: (item: WishlistItem) => void;
  onEdit?: (item: WishlistItem) => void;
  onRemove?: (item: WishlistItem) => void;
  onMarkUnavailable?: (item: WishlistItem) => void;
  onAddComment?: (item: WishlistItem) => void;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' ₽';
}

export function ItemCard({
  item,
  isOwner,
  isReserved,
  reservedBy,
  totalContributed,
  onReserve,
  onContribute,
  onUnreserve,
  onEdit,
  onRemove,
  onMarkUnavailable,
  onAddComment,
}: ItemCardProps) {
  const target = item.target_amount ?? item.price;
  const isGroupGift = item.target_amount != null && item.target_amount > 0;
  const progress = target && target > 0 ? Math.min(100, (totalContributed / target) * 100) : 0;
  const isFullyFunded = isGroupGift && target && totalContributed >= target;
  const comments = Array.isArray(item.comments) ? item.comments : [];
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <article className="card item-card card-hover animate-in">
      <div className="item-card-inner">
        <div className="item-card-image-wrap">
          {item.image_url ? (
            <>
              <img
                src={item.image_url}
                alt=""
                className="item-card-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <span className="item-card-image-placeholder hidden">🎁</span>
            </>
          ) : (
            <span className="item-card-image-placeholder">🎁</span>
          )}
        </div>
        <div className="item-card-body">
          {item.is_unavailable && (
            <span className="badge badge-unavailable item-card-badge-wrap">
              Товар недоступен
            </span>
          )}
          <h3 className="item-card-title">
            {item.url ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
            ) : (
              item.title
            )}
          </h3>
          {item.price != null && (
            <p className="item-card-meta">
              {isGroupGift ? (
                <>
                  Цель: {formatPrice(item.target_amount!)}
                  {totalContributed > 0 && (
                    <span className="item-card-meta-contrib">
                      · Собрано {formatPrice(totalContributed)}
                      {isFullyFunded && ' ✓'}
                    </span>
                  )}
                </>
              ) : (
                formatPrice(item.price)
              )}
            </p>
          )}
          {isGroupGift && (
            <div
              className="progress-bar item-card-progress"
              style={{ '--item-progress': `${progress}%` } as React.CSSProperties}
            >
              <div className="progress-bar-fill" />
            </div>
          )}
          {isReserved && (
            <p className="item-card-reserved">
              <span className="badge badge-reserved">
                {isOwner ? 'Кто-то уже подарит' : `Зарезервировал: ${reservedBy}`}
              </span>
            </p>
          )}
          <div className="item-card-actions">
            {!isOwner && !isReserved && onReserve && (
              <button type="button" className="btn-primary" onClick={() => onReserve(item)}>
                Я подарю это
              </button>
            )}
            {!isOwner && isReserved && item.reserved_by_me && onUnreserve && (
              <button type="button" className="btn-ghost" onClick={() => onUnreserve(item)}>
                Отменить резерв
              </button>
            )}
            {!isOwner && isGroupGift && onContribute && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onContribute(item)}
                disabled={Boolean(isFullyFunded)}
              >
                Скинуться
              </button>
            )}
            {isOwner && onEdit && (
              <button type="button" className="btn-ghost" onClick={() => onEdit(item)}>
                Редактировать
              </button>
            )}
            {isOwner && onMarkUnavailable && !item.is_unavailable && (
              <button type="button" className="btn-ghost" onClick={() => onMarkUnavailable(item)}>
                Товар недоступен
              </button>
            )}
            {isOwner && onRemove && (
              <button type="button" className="btn-ghost btn-danger" onClick={() => onRemove(item)}>
                Удалить
              </button>
            )}
            {!isOwner && onAddComment && (
              <button type="button" className="btn-ghost" onClick={() => onAddComment(item)}>
                Комментарий
              </button>
            )}
          </div>
          {isOwner && comments.length > 0 && (
            <div className="item-card-comments">
              <button
                type="button"
                className="btn-ghost item-card-comments-toggle"
                onClick={() => setCommentsOpen((o) => !o)}
              >
                Комментарии ({comments.length})
              </button>
              {commentsOpen && (
                <ul className="item-card-comments-list">
                  {(comments ?? []).map((c) => (
                    <li key={c.id} className="item-card-comment-item">
                      {c.body} — {formatCommentDate(c.created_at)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
