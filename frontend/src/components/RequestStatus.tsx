import { TravelRequestRecord } from '../api/travelRequests';
import { ApprovalTimeline } from './ApprovalTimeline';
import { BookingConfirmation } from './BookingConfirmation';
import { ItineraryDetail } from './ItineraryDetail';
import { PriceDriftCheck } from './PriceDriftCheck';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';
import { formatMoney } from '../utils/travel';

interface Props {
  request: TravelRequestRecord;
  onApprove: () => void;
  onReject: () => void;
  onStartOver: () => void;
  onCancelled: (updated: TravelRequestRecord) => void;
  deciding: boolean;
}

export function RequestStatus({ request, onApprove, onReject, onStartOver, onCancelled, deciding }: Props) {
  const { selectedOffer, trip, employee } = request;
  const outbound = selectedOffer.itineraries[0];
  const firstSeg = outbound.segments[0];
  const airlineName = selectedOffer.airlineNames[0] ?? selectedOffer.airlines[0];

  if ((request.status === 'booked' || request.status === 'cancelled') && request.booking) {
    return <BookingConfirmation request={request} onStartOver={onStartOver} onCancelled={onCancelled} />;
  }

  return (
    <div className="request-status animate-slide-up">
      <div className="request-status__header">
        <span className="eyebrow">Travel request</span>
        <h2 className="request-status__title">Approval status</h2>
        <p className="request-status__id">Request {request.id.slice(0, 8)}</p>
      </div>

      <ApprovalTimeline status={request.status} />

      <div className="request-status__summary card-surface">
        <div className="request-status__row">
          <span>Traveler</span>
          <span>{employee.givenName} {employee.familyName}</span>
        </div>
        <div className="request-status__row">
          <span>Route</span>
          <span>
            {trip.originLocationCode} → {trip.destinationLocationCode}
            {trip.returnDate ? ' · Round trip' : ''}
          </span>
        </div>
        <div className="request-status__row">
          <span>Airline</span>
          <span>{airlineName}</span>
        </div>
        <div className="request-status__row">
          <span>Departure</span>
          <span>
            {firstSeg.from} · {new Date(firstSeg.departure).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </div>
        {request.status === 'pending_approval' ? (
          <PriceDriftCheck requestId={request.id} fallbackPrice={selectedOffer.price} />
        ) : (
          <div className="request-status__row">
            <span>Fare</span>
            <span>{formatMoney(selectedOffer.price.currency, selectedOffer.price.total)}</span>
          </div>
        )}
      </div>

      {request.status === 'pending_approval' && (
        <div className="booking-confirmation__itineraries">
          <ItineraryDetail label="Outbound" itinerary={selectedOffer.itineraries[0]} />
          {selectedOffer.itineraries[1] && (
            <ItineraryDetail label="Return" itinerary={selectedOffer.itineraries[1]} />
          )}
        </div>
      )}

      {request.status === 'pending_approval' && (
        <div className="manager-panel">
          <div className="manager-panel__header">
            <StatusBadge variant="warning">Awaiting manager</StatusBadge>
            <p className="manager-panel__text">
              {request.managerName ?? 'Your manager'} needs to approve this request before it's booked.
            </p>
          </div>
          <div className="manager-panel__actions">
            <Button variant="ghost" onClick={onReject} disabled={deciding}>
              Reject
            </Button>
            <Button onClick={onApprove} disabled={deciding}>
              {deciding ? 'Processing…' : 'Approve & book'}
            </Button>
          </div>
        </div>
      )}

      {request.status === 'booking' && (
        <div className="loading-panel">
          <div className="loading-panel__spinner" />
          <p>Booking your flight with the airline…</p>
        </div>
      )}

      {request.status === 'booking_failed' && (
        <div className="error-panel">
          <StatusBadge variant="danger">Booking failed</StatusBadge>
          <p>{request.failureReason ?? 'The fare could not be confirmed. No charge was made.'}</p>
          <Button onClick={onStartOver}>Start over</Button>
        </div>
      )}

      {request.status === 'rejected' && (
        <div className="error-panel">
          <StatusBadge variant="danger">Rejected</StatusBadge>
          <p>{request.rejectionReason || 'Your manager declined this request.'}</p>
          <Button onClick={onStartOver}>Start over</Button>
        </div>
      )}
    </div>
  );
}
