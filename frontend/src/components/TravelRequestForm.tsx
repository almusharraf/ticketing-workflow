import { TravelRequestInput } from '../api/flights';
import { AirportAutocomplete } from './AirportAutocomplete';
import { PassengerCard } from './PassengerCard';
import { Button } from './ui/Button';

interface Props {
  value: TravelRequestInput;
  onChange: (value: TravelRequestInput) => void;
  onSubmit: () => void;
  loading: boolean;
}

const AIRLINE_OPTIONS = ['BA', 'VS', 'KL', 'LH', 'AF', 'EK', 'QR'];

export function TravelRequestForm({ value, onChange, onSubmit, loading }: Props) {
  const { employee, trip } = value;

  function updateTrip<K extends keyof TravelRequestInput['trip']>(key: K, val: TravelRequestInput['trip'][K]) {
    onChange({ ...value, trip: { ...trip, [key]: val } });
  }

  function swapAirports() {
    onChange({
      ...value,
      trip: {
        ...trip,
        originLocationCode: trip.destinationLocationCode,
        destinationLocationCode: trip.originLocationCode,
      },
    });
  }

  function toggleAirline(code: string) {
    const current = trip.preferredAirlines ?? [];
    const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
    updateTrip('preferredAirlines', next.length ? next : undefined);
  }

  return (
    <form
      className="travel-request-card animate-slide-up"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="card-section">
        <div className="card-section__header">
          <span className="eyebrow">Employee</span>
          <h2 className="card-section__title">Travel request</h2>
        </div>
        <PassengerCard employee={employee} />
      </div>

      <div className="card-section">
        <div className="card-section__header">
          <span className="eyebrow">Itinerary</span>
        </div>
        <div className="route-fields">
          <AirportAutocomplete
            label="Origin"
            placeholder="Search airport or city"
            value={trip.originLocationCode}
            onChange={(code) => updateTrip('originLocationCode', code)}
          />
          <button type="button" className="route-swap" aria-label="Swap origin and destination" onClick={swapAirports}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6h8M8 2v8M12 10H4M8 14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <AirportAutocomplete
            label="Destination"
            placeholder="Search airport or city"
            value={trip.destinationLocationCode}
            onChange={(code) => updateTrip('destinationLocationCode', code)}
          />
        </div>

        <div className="field-grid field-grid--2">
          <label className="field">
            <span className="field-label">Departure</span>
            <input
              className="field-input"
              type="date"
              value={trip.departureDate}
              onChange={(e) => updateTrip('departureDate', e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Return</span>
            <input
              className="field-input"
              type="date"
              value={trip.returnDate ?? ''}
              onChange={(e) => updateTrip('returnDate', e.target.value || undefined)}
            />
          </label>
        </div>
      </div>

      <div className="card-section">
        <div className="field-grid field-grid--2">
          <div className="field">
            <span className="field-label">Cabin</span>
            <div className="segmented">
              {(['ECONOMY', 'BUSINESS'] as const).map((cabin) => (
                <button
                  type="button"
                  key={cabin}
                  className={`segmented__item ${cabin === trip.cabinClass ? 'segmented__item--active' : ''}`}
                  onClick={() => updateTrip('cabinClass', cabin)}
                >
                  {cabin === 'ECONOMY' ? 'Economy' : 'Business'}
                </button>
              ))}
            </div>
          </div>
          <label className="field">
            <span className="field-label">Checked bags</span>
            <input
              className="field-input field-input--compact"
              type="number"
              min={0}
              max={5}
              value={trip.checkedBags ?? 0}
              onChange={(e) => updateTrip('checkedBags', Number(e.target.value))}
            />
          </label>
        </div>

        <div className="field">
          <span className="field-label">Preferred airline <span className="field-label__optional">optional</span></span>
          <div className="chip-group">
            {AIRLINE_OPTIONS.map((code) => (
              <button
                key={code}
                type="button"
                className={`chip ${trip.preferredAirlines?.includes(code) ? 'chip--active' : ''}`}
                onClick={() => toggleAirline(code)}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field-label">Reason for travel <span className="field-label__optional">optional</span></span>
          <input
            className="field-input"
            value={trip.reason ?? ''}
            onChange={(e) => updateTrip('reason', e.target.value || undefined)}
            placeholder="e.g. Annual leave, family visit"
          />
        </label>
      </div>

      <Button type="submit" fullWidth size="lg" disabled={loading}>
        {loading ? 'Searching live fares…' : 'Search flights'}
      </Button>
    </form>
  );
}
