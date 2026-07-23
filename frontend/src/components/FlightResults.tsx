import { useMemo, useState } from 'react';
import { FlightOfferSummary } from '../api/flights';
import { computeFlightBadges, filterAndSortOffers, FlightFilter } from '../utils/travel';
import { FlightCard } from './FlightCard';
import { FlightFilters } from './FlightFilters';
import { FlightCardSkeleton } from './ui/Skeleton';

interface Props {
  offers: FlightOfferSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  preferredAirlines?: string[];
  loading?: boolean;
}

export function FlightResults({ offers, selectedId, onSelect, preferredAirlines, loading }: Props) {
  const [filter, setFilter] = useState<FlightFilter>('cheapest');

  const filtered = useMemo(() => filterAndSortOffers(offers, filter), [offers, filter]);
  const badges = useMemo(() => computeFlightBadges(offers, preferredAirlines), [offers, preferredAirlines]);

  if (loading) {
    return (
      <div className="flight-results">
        <FlightFilters active={filter} onChange={setFilter} />
        <div className="flight-results__list">
          {Array.from({ length: 3 }).map((_, i) => (
            <FlightCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">✈</div>
        <h3 className="empty-state__title">No fares found</h3>
        <p className="empty-state__text">Try adjusting dates, cabin class, or route for live Duffel availability.</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flight-results">
        <FlightFilters active={filter} onChange={setFilter} />
        <div className="empty-state empty-state--compact">
          <p className="empty-state__text">No flights match this filter. Try another option.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flight-results animate-slide-up">
      <div className="flight-results__header">
        <div>
          <span className="eyebrow">Live results</span>
          <h2 className="flight-results__title">{filtered.length} fares from Duffel</h2>
        </div>
      </div>
      <FlightFilters active={filter} onChange={setFilter} />
      <div className="flight-results__list">
        {filtered.map((offer) => (
          <FlightCard
            key={offer.id}
            offer={offer}
            badges={badges[offer.id] ?? []}
            selected={offer.id === selectedId}
            onSelect={() => onSelect(offer.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function FlightComparison({ offers, selectedId }: { offers: FlightOfferSummary[]; selectedId: string | null }) {
  const selected = offers.find((o) => o.id === selectedId);
  if (!selected || offers.length < 2) return null;

  const cheapest = [...offers].sort((a, b) => Number(a.price.total) - Number(b.price.total))[0];
  const savings = Number(selected.price.total) - Number(cheapest.price.total);

  if (savings <= 0) return null;

  return (
    <div className="flight-comparison">
      <span className="flight-comparison__label">vs. cheapest</span>
      <span className="flight-comparison__value">
        +{selected.price.currency} {Math.round(savings)}
      </span>
    </div>
  );
}
