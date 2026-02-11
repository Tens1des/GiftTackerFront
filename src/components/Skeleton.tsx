export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`.trim()} style={style} aria-hidden />;
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Skeleton style={{ width: 100, height: 100, borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <Skeleton style={{ height: 20, width: '80%', marginBottom: 8 }} />
          <Skeleton style={{ height: 16, width: '50%', marginBottom: 12 }} />
          <Skeleton style={{ height: 32, width: 120 }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonWishlistList({ count = 3 }: { count?: number }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} style={{ marginBottom: 12 }}>
          <div className="card" style={{ padding: '20px' }}>
            <Skeleton style={{ height: 22, width: '60%', marginBottom: 8 }} />
            <Skeleton style={{ height: 16, width: '40%' }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SkeletonItemCards({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
