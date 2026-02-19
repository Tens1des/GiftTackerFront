import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { EmptyWishlist } from '../components/EmptyWishlist';
import { ShareBlock } from '../components/ShareBlock';
import { ItemCard } from '../components/ItemCard';
import { AddItemForm } from '../components/AddItemForm';
import { ReserveModal } from '../components/ReserveModal';
import { ContributeModal } from '../components/ContributeModal';
import { EditItemModal } from '../components/EditItemModal';
import { SkeletonItemCards } from '../components/Skeleton';
import { useWishlist } from '../hooks/useWishlist';
import { useToast } from '../contexts/ToastContext';
import {
  addWishlistItem,
  updateWishlistItem,
  updateWishlist,
  deleteWishlistItem,
  reserveItem,
  unreserveItem,
  addContribution,
  addItemComment,
  reorderItems,
} from '../lib/api';
import { formatDeadline, isDeadlinePast } from '../lib/dateUtils';
import type { WishlistItem } from '../types';
import { EditWishlistModal } from '../components/EditWishlistModal';
import { CommentModal } from '../components/CommentModal';
import { SortableItemList } from '../components/SortableItemList';

export function WishlistView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { wishlist, items, loading: wishlistLoading, error: wishlistError, isOwner, refetch } = useWishlist(slug);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'reserved'>('all');

  const reservedSet = useMemo(
    () => new Set(items.filter((i) => i.reserved).map((i) => i.id)),
    [items]
  );
  const reservationByItem = useMemo(() => {
    const m = new Map<string, string>();
    items.forEach((i) => {
      if (i.reserved_by) m.set(i.id, i.reserved_by);
    });
    return m;
  }, [items]);
  const totalByItem = useMemo(() => {
    const t: Record<string, number> = {};
    items.forEach((i) => {
      t[i.id] = (i.total_contributed_cents ?? 0) / 100;
    });
    return t;
  }, [items]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [reserveModalItem, setReserveModalItem] = useState<WishlistItem | null>(null);
  const [contributeModalItem, setContributeModalItem] = useState<WishlistItem | null>(null);
  const [editModalItem, setEditModalItem] = useState<WishlistItem | null>(null);
  const [showEditWishlist, setShowEditWishlist] = useState(false);
  const [commentModalItem, setCommentModalItem] = useState<WishlistItem | null>(null);
  const isPastDeadline = isDeadlinePast(wishlist?.deadline_at);

  const filteredItems = useMemo(() => {
    let list = items;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.url && i.url.toLowerCase().includes(q))
      );
    }
    if (filterStatus === 'reserved') {
      list = list.filter((i) => reservedSet.has(i.id));
    } else if (filterStatus === 'available') {
      list = list.filter((i) => !reservedSet.has(i.id));
    }
    return list;
  }, [items, searchQuery, filterStatus, reservedSet]);

  if (wishlistLoading || !slug) {
    return (
      <Layout>
        <div className="container">
          <SkeletonItemCards count={4} />
        </div>
      </Layout>
    );
  }

  if (wishlistError || !wishlist) {
    return (
      <Layout>
        <div className="container">
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Список не найден или ссылка неверная.
            </p>
            <button type="button" className="btn-primary" onClick={() => navigate('/')}>
              На главную
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const viewUrl = `${window.location.origin}/w/${wishlist.slug}`;
  const editUrl = `${window.location.origin}/w/${wishlist.slug}/edit`;

  return (
    <Layout>
      <div className="container">
        <header style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h1 className="page-title" style={{ marginBottom: '4px' }}>
                {wishlist.title}
              </h1>
              {wishlist.occasion && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
                  {wishlist.occasion}
                  {wishlist.owner_name && ` · ${wishlist.owner_name}`}
                </p>
              )}
              {wishlist.deadline_at && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '6px 0 0' }}>
                  {isPastDeadline ? 'Сбор закрыт' : `Список активен до ${formatDeadline(wishlist.deadline_at)}`}
                </p>
              )}
            </div>
            {isOwner && (
              <button type="button" className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => setShowEditWishlist(true)}>
                Настройки списка
              </button>
            )}
          </div>
        </header>

        {isOwner && (
          <div style={{ marginBottom: '24px' }}>
            <ShareBlock viewUrl={viewUrl} editUrl={editUrl} title={wishlist.title} />
          </div>
        )}

        {isOwner && (
          <div style={{ marginBottom: 20 }}>
            {!showAddForm ? (
              <button type="button" className="btn-primary" onClick={() => setShowAddForm(true)}>
                + Добавить подарок
              </button>
            ) : (
              <AddItemForm
                onSubmit={async (item) => {
                  await addWishlistItem(wishlist.id, item);
                  setShowAddForm(false);
                  await refetch();
                  toast.success('Подарок добавлен');
                }}
                onCancel={() => setShowAddForm(false)}
              />
            )}
          </div>
        )}

        {items.length > 0 && (
          <div className="wishlist-toolbar" style={{ marginBottom: 20 }}>
            <input
              type="search"
              placeholder="Поиск по названию или ссылке..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ maxWidth: 320 }}
              aria-label="Поиск"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              {(['all', 'available', 'reserved'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={filterStatus === f ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding: '8px 14px', fontSize: '0.9rem' }}
                  onClick={() => setFilterStatus(f)}
                >
                  {f === 'all' ? 'Все' : f === 'available' ? 'Свободные' : 'Занятые'}
                </button>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyWishlist isOwner={isOwner} onAddFirst={() => setShowAddForm(true)} />
        ) : !isOwner && filteredItems.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Ничего не найдено. Измените поиск или фильтр.</p>
          </div>
        ) : (
          <section>
            <SortableItemList
              items={isOwner ? items : filteredItems}
              isOwner={isOwner}
              onOrderChange={
                isOwner && wishlist
                  ? (itemIds) =>
                      reorderItems(wishlist.id, itemIds)
                        .then(() => {
                          refetch();
                          toast.success('Порядок сохранён');
                        })
                        .catch((e) => toast.error(e?.message || 'Ошибка'))
                  : () => {}
              }
              renderItem={(item) => (
              <ItemCard
                key={item.id}
                item={item}
                isOwner={isOwner}
                isReserved={reservedSet.has(item.id)}
                reservedBy={reservationByItem.get(item.id)}
                totalContributed={totalByItem[item.id] ?? 0}
                onReserve={!isOwner && !isPastDeadline ? (i) => setReserveModalItem(i) : undefined}
                onContribute={!isOwner && !isPastDeadline ? (i) => setContributeModalItem(i) : undefined}
                onUnreserve={
                  !isOwner && item.reserved_by_me
                    ? (i) => {
                        unreserveItem(i.id).then(() => { refetch(); toast.success('Резерв снят'); }).catch((e) => toast.error(e?.message || 'Ошибка'));
                      }
                    : undefined
                }
                onEdit={isOwner ? (i) => setEditModalItem(i) : undefined}
                onRemove={
                  isOwner
                    ? (i) => {
                        if ((i.total_contributed_cents ?? 0) > 0) {
                          toast.error('Нельзя удалить подарок, на который уже скидывались');
                          return;
                        }
                        if (window.confirm('Удалить этот подарок из списка?')) {
                          deleteWishlistItem(i.id)
                            .then(() => { refetch(); toast.success('Удалено'); })
                            .catch((e) => {
                              const msg = (e?.message || '').includes('contributions') || (e?.message || '').includes('cannot delete') || (e?.message || '').includes('скидывались')
                                ? 'Нельзя удалить подарок, на который уже скидывались'
                                : (e?.message || 'Ошибка');
                              toast.error(msg);
                            });
                        }
                      }
                    : undefined
                }
                onMarkUnavailable={
                  isOwner
                    ? (i) => updateWishlistItem(i.id, { is_unavailable: true }).then(() => { refetch(); toast.success('Отмечено как недоступный'); }).catch((e) => toast.error(e?.message || 'Ошибка'))
                    : undefined
                }
                onAddComment={!isOwner ? (i) => setCommentModalItem(i) : undefined}
              />
              )}
            />
          </section>
        )}

        {reserveModalItem && (
          <ReserveModal
            item={reserveModalItem}
            onConfirm={async (nickname) => {
              await reserveItem(reserveModalItem.id, nickname);
              setReserveModalItem(null);
              await refetch();
              toast.success('Подарок зарезервирован');
            }}
            onClose={() => setReserveModalItem(null)}
          />
        )}
        {contributeModalItem && (
          <ContributeModal
            item={contributeModalItem}
            currentTotal={totalByItem[contributeModalItem.id] ?? 0}
            onConfirm={async (amount, nickname) => {
              try {
                await addContribution(contributeModalItem.id, amount, nickname);
                setContributeModalItem(null);
                await refetch();
                toast.success('Вклад добавлен');
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e ?? '');
                const isExceed = msg.includes('exceed') || msg.includes('превышать') || msg.includes('оставшуюся');
                toast.error(isExceed ? 'Сумма не должна превышать оставшуюся сумму сбора' : msg);
              }
            }}
            onClose={() => setContributeModalItem(null)}
          />
        )}
        {editModalItem && (
          <EditItemModal
            item={editModalItem}
            onSave={async (patch) => {
              await updateWishlistItem(editModalItem.id, patch);
              setEditModalItem(null);
              await refetch();
              toast.success('Изменения сохранены');
            }}
            onClose={() => setEditModalItem(null)}
          />
        )}
        {showEditWishlist && wishlist && (
          <EditWishlistModal
            wishlist={wishlist}
            onSave={async (patch) => {
              await updateWishlist(wishlist.id, {
                title: patch.title,
                description: patch.description,
                deadline_at: patch.deadline_at,
              });
              setShowEditWishlist(false);
              await refetch();
              toast.success('Настройки сохранены');
            }}
            onClose={() => setShowEditWishlist(false)}
          />
        )}
        {commentModalItem && (
          <CommentModal
            item={commentModalItem}
            onSubmit={async (participantName, body) => {
              await addItemComment(commentModalItem.id, participantName, body);
              setCommentModalItem(null);
              await refetch();
              toast.success('Комментарий добавлен');
            }}
            onClose={() => setCommentModalItem(null)}
          />
        )}
      </div>
    </Layout>
  );
}
