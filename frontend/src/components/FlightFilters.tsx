import { FlightFilter } from '../utils/travel';

interface Props {
  active: FlightFilter;
  onChange: (filter: FlightFilter) => void;
}

const FILTERS: { id: FlightFilter; label: string }[] = [
  { id: 'cheapest', label: 'Cheapest' },
  { id: 'fastest', label: 'Fastest' },
  { id: 'direct', label: 'Direct' },
  { id: 'flexible', label: 'Flexible' },
  { id: 'business', label: 'Business' },
  { id: 'economy', label: 'Economy' },
];

export function FlightFilters({ active, onChange }: Props) {
  return (
    <div className="flight-filters">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`flight-filters__item ${active === filter.id ? 'flight-filters__item--active' : ''}`}
          onClick={() => onChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
