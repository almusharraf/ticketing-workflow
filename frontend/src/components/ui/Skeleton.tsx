interface Props {
  lines?: number;
  className?: string;
}

export function Skeleton({ lines = 1, className = '' }: Props) {
  return (
    <div className={`skeleton-wrap ${className}`.trim()}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ width: i === lines - 1 && lines > 1 ? '70%' : '100%' }} />
      ))}
    </div>
  );
}

export function FlightCardSkeleton() {
  return (
    <div className="flight-card flight-card--skeleton">
      <div className="skeleton skeleton--circle" />
      <div className="skeleton-wrap" style={{ flex: 1 }}>
        <div className="skeleton" />
        <div className="skeleton" style={{ width: '60%' }} />
      </div>
      <div className="skeleton" style={{ width: 80, height: 32 }} />
    </div>
  );
}
