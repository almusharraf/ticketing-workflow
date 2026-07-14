import { TravelRequestRecord } from '../api/travelRequests';
import { formatDate, formatMoney } from '../utils/travel';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';
import { ItineraryDetail } from './ItineraryDetail';

interface Props {
  request: TravelRequestRecord;
  onStartOver: () => void;
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

export function BookingConfirmation({ request, onStartOver }: Props) {
  const { selectedOffer, employee, booking } = request;
  const logo = selectedOffer.airlineLogos[0];
  const airlineName = selectedOffer.airlineNames[0] ?? selectedOffer.airlines[0];

  if (!booking) return null;

  return (
    <div className="booking-confirmation animate-slide-up">
      <div className="booking-confirmation__hero">
        <StatusBadge variant="success">Ticket issued</StatusBadge>
        <h2 className="booking-confirmation__title">Your trip is confirmed</h2>
        <p className="booking-confirmation__subtitle">Itinerary sent to {employee.email}.</p>
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

      <div className="booking-confirmation__actions">
        <Button onClick={onStartOver}>Book another trip</Button>
      </div>
    </div>
  );
}
