import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

interface ShareBlockProps {
  viewUrl: string;
  editUrl: string;
  title: string;
}

export function ShareBlock({ viewUrl, editUrl, title }: ShareBlockProps) {
  const [copied, setCopied] = useState<'view' | 'edit' | null>(null);
  const toast = useToast();
  const canShare = typeof navigator !== 'undefined' && navigator.share;

  const copy = (url: string, which: 'view' | 'edit') => {
    navigator.clipboard.writeText(url);
    setCopied(which);
    toast.success('Ссылка скопирована');
    setTimeout(() => setCopied(null), 1500);
  };

  const handleShare = async () => {
    if (!canShare) {
      copy(viewUrl, 'view');
      return;
    }
    try {
      await navigator.share({
        title: title || 'Вишлист',
        text: `Посмотри мой список желаний: ${title}`,
        url: viewUrl,
      });
      toast.success('Поделились!');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') copy(viewUrl, 'view');
    }
  };

  return (
    <div className="card animate-in" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
        Поделиться списком
      </h3>
      <p style={{ marginBottom: 16, fontSize: '0.95rem', color: 'var(--text)' }}>
        Отправьте друзьям ссылку — они увидят «{title}» и смогут зарезервировать подарок или скинуться.
      </p>
      <div className="share-row">
        <input
          type="text"
          readOnly
          value={viewUrl}
          className="input"
          style={{ flex: '1', minWidth: 0, fontSize: '0.9rem' }}
        />
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {canShare && (
            <button type="button" className="btn-secondary" onClick={handleShare}>
              Поделиться
            </button>
          )}
          <button
            type="button"
            className={copied === 'view' ? 'btn-ghost' : 'btn-primary'}
            onClick={() => copy(viewUrl, 'view')}
          >
            {copied === 'view' ? 'Скопировано' : 'Копировать'}
          </button>
        </div>
      </div>
      <p style={{ marginTop: 20, marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Ссылка для редактирования (никому не показывайте):
      </p>
      <div className="share-row">
        <input
          type="text"
          readOnly
          value={editUrl}
          className="input"
          style={{ flex: '1', minWidth: 0, fontSize: '0.9rem' }}
        />
        <button
          type="button"
          className={copied === 'edit' ? 'btn-ghost' : 'btn-secondary'}
          onClick={() => copy(editUrl, 'edit')}
        >
          {copied === 'edit' ? 'Скопировано' : 'Копировать'}
        </button>
      </div>
      <style>{`
        .share-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .share-row .input { max-width: 100%; }
      `}</style>
    </div>
  );
}
