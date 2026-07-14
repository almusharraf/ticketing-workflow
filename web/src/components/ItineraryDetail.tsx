import { FlightOfferSummary } from '../api/flights';
import { formatDate, formatDuration, formatLayover, formatTime } from '../utils/travel';

interface Props {
  label: string;
  itinerary: FlightOfferSummary['itineraries'][number];
}

export function ItineraryDetail({ label, itinerary }: Props) {
  const { segments } = itinerary;

  return (
    <div className="itinerary-detail">
      <div className="itinerary-detail__header">
        <span className="itinerary-detail__label">{label}</span>
        <span className="itinerary-detail__duration">
          {formatDuration(itinerary.duration)} · {segments.length === 1 ? 'Direct' : `${segments.length - 1} stop${segments.length > 2 ? 's' : ''}`}
        </span>
      </div>

      {segments.map((seg, i) => (
        <div key={`${seg.carrierCode}${seg.flightNumber}-${seg.departure}`}>
          <div className="itinerary-detail__segment">
            <div className="itinerary-detail__point">
              <span className="itinerary-detail__time">{formatTime(seg.departure)}</span>
              <span className="itinerary-detail__date">{formatDate(seg.departure)}</span>
              <span className="itinerary-detail__code">{seg.from}</span>
              {seg.terminal && <span className="itinerary-detail__terminal">Terminal {seg.terminal}</span>}
            </div>

            <div className="itinerary-detail__flight">
              <span className="itinerary-detail__flight-number">
                {seg.carrierCode} {seg.flightNumber}
              </span>
              {seg.carrierName && <span className="itinerary-detail__carrier">{seg.carrierName}</span>}
              {seg.aircraft && <span className="itinerary-detail__aircraft">{seg.aircraft}</span>}
            </div>

            <div className="itinerary-detail__point itinerary-detail__point--end">
              <span className="itinerary-detail__time">{formatTime(seg.arrival)}</span>
              <span className="itinerary-detail__date">{formatDate(seg.arrival)}</span>
              <span className="itinerary-detail__code">{seg.to}</span>
            </div>
          </div>

          {i < segments.length - 1 && (
            <div className="itinerary-detail__layover">
              Change planes in {seg.to} · {formatLayover(seg.arrival, segments[i + 1].departure)} layover
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
