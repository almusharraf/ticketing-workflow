import { useState } from 'react';
import { getFlightStatus, FlightStatusInfo } from '../api/flightStatus';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';
import { formatDate, formatTime } from '../utils/travel';

interface Props {
  requestId: string;
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'> = {
  scheduled: 'info',
  active: 'accent',
  landed: 'success',
  cancelled: 'danger',
  incident: 'danger',
  diverted: 'warning',
};

function PointRow({ label, point }: { label: string; point: FlightStatusInfo['departure'] }) {
  return (
    <div className="request-status__row">
      <span>{label}</span>
      <span>
        {point.airport} · {formatDate(point.scheduled)} {formatTime(point.actual ?? point.estimated ?? point.scheduled)}
        {point.delayMinutes ? ` (delayed ${point.delayMinutes}m)` : ''}
        {point.terminal ? ` · Terminal ${point.terminal}` : ''}
        {point.gate ? ` · Gate ${point.gate}` : ''}
      </span>
    </div>
  );
}

export function FlightStatusPanel({ requestId }: Props) {
  const [status, setStatus] = useState<FlightStatusInfo | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    setLoading(true);
    setError(null);
    try {
      const result = await getFlightStatus(requestId);
      setStatus(result.status);
      setMessage(result.message ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check flight status');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-section">
      <div className="card-section__header">
        <span className="eyebrow">Live tracking</span>
        <h3 className="card-section__title">Flight status</h3>
      </div>

      <Button variant="outline" onClick={handleCheck} disabled={loading}>
        {loading ? 'Checking…' : 'Check flight status'}
      </Button>

      {error && <div className="error-banner">{error}</div>}

      {status && (
        <div className="request-status__summary card-surface">
          <div className="request-status__row">
            <span>Status</span>
            <StatusBadge variant={STATUS_VARIANT[status.flightStatus] ?? 'default'}>
              {status.flightStatus}
            </StatusBadge>
          </div>
          <PointRow label="Departure" point={status.departure} />
          <PointRow label="Arrival" point={status.arrival} />
        </div>
      )}

      {!status && message && <p className="manager-panel__text">{message}</p>}
    </div>
  );
}
