import { FlightOfferSummary } from '../api/flights';
import { FlightBadge } from '../utils/travel';
import { formatMoney } from '../utils/travel';
import { StatusBadge } from './ui/StatusBadge';
import { ItineraryDetail } from './ItineraryDetail';

const BADGE_CONFIG: Record<FlightBadge, { label: string; variant: 'success' | 'accent' | 'info' | 'warning' }> = {
  cheapest: { label: 'Cheapest', variant: 'accent' },
  fastest: { label: 'Fastest', variant: 'info' },
  flexible: { label: 'Most Flexible', variant: 'success' },
  best_value: { label: 'Best Value', variant: 'info' },
  recommended: { label: 'Preferred Airline', variant: 'success' },
};

const SOURCE_LABELS: Record<FlightOfferSummary['source'], string> = {
  duffel: 'Duffel',
  kiwi: 'Kiwi.com',
  skyscanner: 'Skyscanner',
  travelpayouts: 'Travelpayouts',
  amadeus: 'Amadeus',
};

function refundLabel(refundability?: FlightOfferSummary['refundability']): string {
  switch (refundability) {
    case 'fully_refundable':
      return 'Fully refundable';
    case 'partially_refundable':
      return 'Partially refundable';
    case 'non_refundable':
      return 'Non-refundable';
    default:
      return 'Refund rules vary';
  }
}

interface Props {
  offer: FlightOfferSummary;
  badges: FlightBadge[];
  selected: boolean;
  onSelect: () => void;
}

export function FlightCard({ offer, badges, selected, onSelect }: Props) {
  const primaryAirline = offer.airlineNames[0] ?? offer.airlines[0];
  const logo = offer.airlineLogos[0];

  return (
    <article
      className={`flight-card ${selected ? 'flight-card--selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      {badges.length > 0 && (
        <div className="flight-card__badges">
          {badges.map((badge) => (
            <StatusBadge key={badge} variant={BADGE_CONFIG[badge].variant}>
              {BADGE_CONFIG[badge].label}
            </StatusBadge>
          ))}
        </div>
      )}

      <div className="flight-card__header">
        <div className="flight-card__airline">
          {logo ? (
            <img src={logo} alt="" className="flight-card__logo" />
          ) : (
            <span className="flight-card__logo-fallback">{offer.airlines[0]}</span>
          )}
          <div>
            <div className="flight-card__airline-name">{primaryAirline}</div>
            {offer.fareFamily && <div className="flight-card__fare-family">{offer.fareFamily}</div>}
          </div>
        </div>
        <div className="flight-card__price">
          <span className="flight-card__price-amount">
            {formatMoney(offer.price.currency, offer.price.total)}
          </span>
          <span className="flight-card__price-note">per traveler</span>
        </div>
      </div>

      <div className="flight-card__source">
        <StatusBadge variant={offer.source === 'duffel' ? 'default' : 'info'}>
          via {SOURCE_LABELS[offer.source]}
        </StatusBadge>
        {offer.source !== 'duffel' && (
          <span className="flight-card__source-note">
            Comparison price only — fare is confirmed via Duffel at booking
          </span>
        )}
      </div>

      <div className="flight-card__itineraries">
        <ItineraryDetail label="Outbound" itinerary={offer.itineraries[0]} />
        {offer.itineraries[1] && <ItineraryDetail label="Return" itinerary={offer.itineraries[1]} />}
      </div>

      <div className="flight-card__amenities">
        <span className="flight-card__amenity">{refundLabel(offer.refundability)}</span>
        {offer.carryOn && <span className="flight-card__amenity">{offer.carryOn}</span>}
        {offer.checkedBaggage && <span className="flight-card__amenity">{offer.checkedBaggage}</span>}
        {offer.wifi && <span className="flight-card__amenity">WiFi</span>}
        {offer.powerOutlets && <span className="flight-card__amenity">Power</span>}
        {offer.carbonEmissionsKg != null && (
          <span className="flight-card__amenity">{offer.carbonEmissionsKg} kg CO₂</span>
        )}
      </div>

      <div className="flight-card__footer">
        <StatusBadge variant="default">{offer.cabin}</StatusBadge>
        <span className={`flight-card__select ${selected ? 'flight-card__select--active' : ''}`}>
          {selected ? 'Selected' : 'Select'}
        </span>
      </div>
    </article>
  );
}
