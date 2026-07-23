import { FlightOfferSummary, TravelRequestInput } from '../api/flights';
import { formatMoney } from '../utils/travel';
import { Button } from './ui/Button';

interface Props {
  request: TravelRequestInput;
  offer: FlightOfferSummary | null;
  showSubmit?: boolean;
  onSubmit?: () => void;
  submitting?: boolean;
}

export function BookingSummary({ request, offer, showSubmit, onSubmit, submitting }: Props) {
  const { trip } = request;
  const flightCost = offer ? Number(offer.price.total) : 0;
  const taxes = offer?.price.tax ? Number(offer.price.tax) : 0;
  const base = offer?.price.base ? Number(offer.price.base) : flightCost - taxes;

  return (
    <aside className="booking-summary">
      <div className="booking-summary__inner">
        <div className="booking-summary__header">
          <span className="eyebrow">Fare summary</span>
          <h3 className="booking-summary__title">Trip total</h3>
        </div>

        <div className="booking-summary__rows">
          <div className="booking-summary__row">
            <span>Flight cost</span>
            <span>{offer ? formatMoney(offer.price.currency, base) : '—'}</span>
          </div>
          <div className="booking-summary__row">
            <span>Taxes & fees</span>
            <span>{offer ? formatMoney(offer.price.currency, taxes) : '—'}</span>
          </div>
          <div className="booking-summary__row booking-summary__row--total">
            <span>Total</span>
            <span>{offer ? formatMoney(offer.price.currency, flightCost) : '—'}</span>
          </div>
        </div>

        {trip.reason && (
          <>
            <div className="booking-summary__divider" />
            <div className="booking-summary__meta">
              <div className="booking-summary__meta-row">
                <span>Reason</span>
                <span>{trip.reason}</span>
              </div>
            </div>
          </>
        )}

        {showSubmit && offer && (
          <Button fullWidth size="lg" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit for approval'}
          </Button>
        )}
      </div>
    </aside>
  );
}
