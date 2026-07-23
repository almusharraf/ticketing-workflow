import { config } from '../../config';
import { TravelRequestInput, FlightOfferSummary } from '../../types/travel';

// Kiwi's Tequila API is invitation-only for new partners as of 2026 - this
// client is written against the last publicly documented /v2/search shape.
// Verify field names against your own sandbox response once you have access.
const BASE_URL = 'https://tequila-api.kiwi.com';

interface KiwiRoute {
  flyFrom: string;
  flyTo: string;
  local_departure: string;
  local_arrival: string;
  airline: string;
  operating_carrier?: string;
  flight_no: number;
}

interface KiwiResult {
  id: string;
  price: number;
  duration: { total: number; departure?: number; return?: number };
  route: KiwiRoute[];
}

interface KiwiSearchResponse {
  data: KiwiResult[];
  currency: string;
}

function toDdMmYyyy(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function minutesToIsoDuration(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `PT${hours}H${minutes}M`;
}

export async function searchKiwiFlights(input: TravelRequestInput): Promise<FlightOfferSummary[]> {
  if (!config.kiwi.apiKey) return [];

  const { trip } = input;
  const params = new URLSearchParams({
    fly_from: trip.originLocationCode,
    fly_to: trip.destinationLocationCode,
    dateFrom: toDdMmYyyy(trip.departureDate),
    dateTo: toDdMmYyyy(trip.departureDate),
    adults: '1',
    curr: 'USD',
    sort: 'price',
    limit: '5',
    selected_cabins: trip.cabinClass === 'BUSINESS' ? 'C' : 'M',
  });

  if (trip.returnDate) {
    params.set('returnFrom', toDdMmYyyy(trip.returnDate));
    params.set('returnTo', toDdMmYyyy(trip.returnDate));
  }

  try {
    const res = await fetch(`${BASE_URL}/v2/search?${params.toString()}`, {
      headers: { apikey: config.kiwi.apiKey, Accept: 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[kiwi] search failed (${res.status})`);
      return [];
    }

    const body = (await res.json()) as KiwiSearchResponse;
    return (body.data ?? []).map((result) => toSummary(result, body.currency, trip.cabinClass));
  } catch (err) {
    console.warn('[kiwi] search errored', err);
    return [];
  }
}

function toSummary(result: KiwiResult, currency: string, cabinClass: string): FlightOfferSummary {
  // Kiwi's virtual-interlining itineraries can mix legs across multiple
  // "routes" belonging to one outbound + one return; split on the first leg
  // that flies back toward the origin isn't reliable, so we treat the whole
  // route array as a single itinerary when there's no return date, and split
  // in half when there is one (best-effort - Kiwi doesn't flag slice boundaries
  // in this response the way Duffel does).
  const segments = result.route.map((seg) => ({
    from: seg.flyFrom,
    to: seg.flyTo,
    departure: new Date(seg.local_departure).toISOString(),
    arrival: new Date(seg.local_arrival).toISOString(),
    carrierCode: seg.operating_carrier ?? seg.airline,
    flightNumber: String(seg.flight_no),
  }));

  const midpoint = result.duration.return != null ? Math.ceil(segments.length / 2) : segments.length;
  const itineraries = [
    {
      duration: minutesToIsoDuration(result.duration.departure ?? result.duration.total),
      segments: segments.slice(0, midpoint),
    },
  ];
  if (midpoint < segments.length) {
    itineraries.push({
      duration: minutesToIsoDuration(result.duration.return ?? 0),
      segments: segments.slice(midpoint),
    });
  }

  const airlines = Array.from(new Set(segments.map((s) => s.carrierCode)));

  return {
    id: `kiwi:${result.id}`,
    source: 'kiwi',
    price: { total: String(result.price), currency },
    airlines,
    airlineNames: airlines,
    airlineLogos: [],
    cabin: cabinClass,
    stops: segments.length - 1,
    itineraries,
    raw: result,
  };
}
