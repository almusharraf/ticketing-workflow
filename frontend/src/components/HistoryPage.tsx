import { useEffect, useState } from 'react';
import { listTravelRequests, TravelRequestSummary } from '../api/history';
import { TravelRequestStatus } from '../api/travelRequests';
import { StatusBadge } from './ui/StatusBadge';
import { formatMoney } from '../utils/travel';
import './HistoryPage.css';

const STATUS_VARIANT: Record<TravelRequestStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'> = {
  pending_approval: 'warning',
  approved: 'info',
  booking: 'info',
  booked: 'success',
  booking_failed: 'danger',
  rejected: 'danger',
  cancelled: 'danger',
};

function formatCell(dateTime?: string): string {
  if (!dateTime) return '—';
  return new Date(dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export function HistoryPage() {
  const [requests, setRequests] = useState<TravelRequestSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTravelRequests()
      .then(setRequests)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load history'));
  }, []);

  return (
    <div className="erp-shell">
      <header className="erp-header">
        <div className="erp-header__breadcrumb">
          <span>ERP</span>
          <span className="erp-header__sep">/</span>
          <span>Travel</span>
          <span className="erp-header__sep">/</span>
          <span className="erp-header__current">History</span>
        </div>
        <div className="erp-header__main">
          <div>
            <span className="eyebrow">Travel</span>
            <h1 className="erp-header__title">Request history</h1>
          </div>
          <a className="erp-header__back" href="/">
            ← New request
          </a>
        </div>
      </header>

      <div className="erp-layout">
        <main className="erp-main">
          {error && <div className="error-banner">{error}</div>}

          {!error && !requests && <p>Loading…</p>}

          {requests && requests.length === 0 && (
            <div className="empty-state">
              <p className="empty-state__title">No travel requests yet</p>
              <p className="empty-state__text">Submitted requests will show up here.</p>
            </div>
          )}

          {requests && requests.length > 0 && (
            <div className="card-surface history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Route</th>
                    <th>Departure</th>
                    <th>Return</th>
                    <th>Status</th>
                    <th>Fare</th>
                    <th>PNR</th>
                    <th>Booked</th>
                    <th>Cancelled</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} onClick={() => (window.location.href = `/?id=${r.id}`)}>
                      <td>{r.employeeName}</td>
                      <td>{r.route}</td>
                      <td>{r.departureDate}</td>
                      <td>{r.returnDate ?? '—'}</td>
                      <td>
                        <StatusBadge variant={STATUS_VARIANT[r.status] ?? 'default'}>
                          {r.status.replace(/_/g, ' ')}
                        </StatusBadge>
                      </td>
                      <td>{formatMoney(r.fare.currency, r.fare.total)}</td>
                      <td className="history-table__mono">{r.pnr ?? '—'}</td>
                      <td>{formatCell(r.bookedAt)}</td>
                      <td>{formatCell(r.cancelledAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
