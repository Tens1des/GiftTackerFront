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
  const comments = item.comments ?? [];
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <article className="card item-card card-hover animate-in" style={{ padding: 0, marginBottom: 16 }}>
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
            <span className="badge badge-unavailable" style={{ marginBottom: 8 }}>
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
                    <span style={{ marginLeft: 8 }}>
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
            <div className="progress-bar" style={{ marginBottom: 12, maxWidth: 280 }}>
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
          {isReserved && (
            <p style={{ margin: '0 0 8px', fontSize: '0.9rem' }}>
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
            {!isOwner && isReserved && onUnreserve && (
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
            <div className="item-card-comments" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: 0, fontSize: '0.9rem', marginBottom: 8 }}
                onClick={() => setCommentsOpen((o) => !o)}
              >
                Комментарии ({comments.length})
              </button>
              {commentsOpen && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {comments.map((c) => (
                    <li key={c.id} style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                      {c.body} — {formatCommentDate(c.created_at)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        .item-card-inner {
          display: flex;
          gap: 20px;
          padding: 20px;
          flex-wrap: wrap;
        }
        .item-card-image-wrap {
          width: 140px;
          height: 140px;
          border-radius: var(--radius-sm);
          background: var(--border);
          flex-shrink: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .item-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .item-card-image-placeholder {
          font-size: 2.8rem;
          opacity: 0.5;
        }
        .item-card-image-placeholder.hidden {
          display: none;
        }
        .item-card-body { flex: 1; min-width: 200px; }
        .item-card-title {
          margin: 0 0 6px;
          font-size: 1.15rem;
          font-weight: 600;
        }
        .item-card-title a {
          color: inherit;
          text-decoration: none;
        }
        .item-card-title a:hover { color: var(--accent); text-decoration: underline; }
        .item-card-meta {
          margin: 0 0 8px;
          color: var(--text-muted);
          font-size: 0.95rem;
        }
        .item-card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }
        .btn-danger { color: #9a3b3b; }
        .btn-danger:hover { background: #f5e6e6; color: #9a3b3b; }
      `}</style>
    </article>
  );
}
