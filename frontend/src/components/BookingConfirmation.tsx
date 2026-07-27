import { useState } from 'react';
import { TravelRequestRecord, cancelTravelRequest } from '../api/travelRequests';
import { formatDate, formatMoney } from '../utils/travel';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';
import { ItineraryDetail } from './ItineraryDetail';
import { FlightStatusPanel } from './FlightStatusPanel';

interface Props {
  request: TravelRequestRecord;
  onStartOver: () => void;
  onCancelled: (updated: TravelRequestRecord) => void;
}

export function ReceiptCard({ request }: { request: TravelRequestRecord }) {
  const { booking } = request;
  if (!booking) return null;

  return (
    <div className="receipt-card">
      <div className="receipt-card__row">
        <span>Amount charged</span>
        <span className="receipt-card__amount">
          {formatMoney(booking.chargedCurrency, booking.chargedAmount)}
        </span>
      </div>
      <div className="receipt-card__row">
        <span>Order reference</span>
        <span className="receipt-card__mono">{booking.orderId}</span>
      </div>
      <div className="receipt-card__row">
        <span>Booked</span>
        <span>{formatDate(booking.bookedAt)}</span>
      </div>
    </div>
  );
}

function CancelSection({ request, onCancelled }: { request: TravelRequestRecord; onCancelled: (u: TravelRequestRecord) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmCancel() {
    setCancelling(true);
    setError(null);
    try {
      const updated = await cancelTravelRequest(request.id);
      onCancelled(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  }

  if (confirming) {
    return (
      <div className="manager-panel">
        <p className="manager-panel__text">
          Cancel this trip? This can't be undone and will request a refund from the airline.
        </p>
        {error && <div className="error-banner">{error}</div>}
        <div className="manager-panel__actions">
          <Button variant="ghost" onClick={() => setConfirming(false)} disabled={cancelling}>
            Keep trip
          </Button>
          <Button variant="danger" onClick={handleConfirmCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling…' : 'Yes, cancel trip'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="danger" onClick={() => setConfirming(true)}>
      Cancel trip
    </Button>
  );
}

export function BookingConfirmation({ request, onStartOver, onCancelled }: Props) {
  const { selectedOffer, employee, booking, cancellation } = request;
  const logo = selectedOffer.airlineLogos[0];
  const airlineName = selectedOffer.airlineNames[0] ?? selectedOffer.airlines[0];
  const isCancelled = request.status === 'cancelled';

  if (!booking) return null;

  return (
    <div className="booking-confirmation animate-slide-up">
      <div className="booking-confirmation__hero">
        <StatusBadge variant={isCancelled ? 'danger' : 'success'}>
          {isCancelled ? 'Trip cancelled' : 'Ticket issued'}
        </StatusBadge>
        <h2 className="booking-confirmation__title">
          {isCancelled ? 'This trip was cancelled' : 'Your trip is confirmed'}
        </h2>
        <p className="booking-confirmation__subtitle">
          {isCancelled ? `Refund processed for ${employee.email}.` : `Itinerary sent to ${employee.email}.`}
        </p>
      </div>

      <div className="booking-confirmation__ticket">
        <div className="booking-confirmation__airline">
          {logo ? (
            <img src={logo} alt="" className="booking-confirmation__logo" />
          ) : (
            <span className="booking-confirmation__logo-fallback">{selectedOffer.airlines[0]}</span>
          )}
          <div>
            <div className="booking-confirmation__airline-name">{airlineName}</div>
            <div className="booking-confirmation__ref-label">Booking reference (PNR)</div>
            <div className="booking-confirmation__ref">{booking.pnr}</div>
          </div>
        </div>

        <div className="booking-confirmation__grid">
          <div className="booking-confirmation__field">
            <span className="booking-confirmation__label">Passenger</span>
            <span className="booking-confirmation__value">
              {employee.givenName} {employee.familyName}
            </span>
          </div>
          <div className="booking-confirmation__field">
            <span className="booking-confirmation__label">Cabin</span>
            <span className="booking-confirmation__value">{selectedOffer.cabin}</span>
          </div>
        </div>

        <div className="booking-confirmation__itineraries">
          <ItineraryDetail label="Outbound" itinerary={selectedOffer.itineraries[0]} />
          {selectedOffer.itineraries[1] && (
            <ItineraryDetail label="Return" itinerary={selectedOffer.itineraries[1]} />
          )}
        </div>

        {booking.fareRules && (
          <div className="booking-confirmation__fare-rules">
            <span className="booking-confirmation__label">Fare rules</span>
            <p>{booking.fareRules}</p>
          </div>
        )}
      </div>

      <ReceiptCard request={request} />

      {isCancelled && cancellation && (
        <div className="receipt-card">
          <div className="receipt-card__row">
            <span>Refund amount</span>
            <span className="receipt-card__amount">
              {formatMoney(cancellation.refundCurrency, cancellation.refundAmount)}
            </span>
          </div>
          <div className="receipt-card__row">
            <span>Cancellation reference</span>
            <span className="receipt-card__mono">{cancellation.cancellationId}</span>
          </div>
          <div className="receipt-card__row">
            <span>Cancelled</span>
            <span>{formatDate(cancellation.cancelledAt)}</span>
          </div>
        </div>
      )}

      {!isCancelled && <FlightStatusPanel requestId={request.id} />}

      <div className="booking-confirmation__actions">
        <Button
          variant="outline"
          onClick={() => window.open(`/api/travel-requests/${request.id}/ticket.pdf`, '_blank')}
        >
          Download ticket (PDF)
        </Button>
        {!isCancelled && <CancelSection request={request} onCancelled={onCancelled} />}
        <Button onClick={onStartOver}>Book another trip</Button>
      </div>
    </div>
  );
}
