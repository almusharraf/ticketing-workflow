import { Button } from './ui/Button';

interface Props {
  message: string;
  onRetry: () => void;
}

export function SearchRetryState({ message, onRetry }: Props) {
  return (
    <div className="retry-state animate-fade-in">
      <div className="retry-state__icon">⚠</div>
      <h3 className="retry-state__title">Duffel search unavailable</h3>
      <p className="retry-state__text">
        {message}. We only show live airline fares — no placeholder results are shown when the
        search provider is down.
      </p>
      <Button onClick={onRetry}>Retry search</Button>
    </div>
  );
}
