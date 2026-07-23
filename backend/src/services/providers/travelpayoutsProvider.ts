import { config } from '../../config';
import { TravelRequestInput, FlightOfferSummary } from '../../types/travel';

// Travelpayouts serves cached fares (not live inventory) - good as a market
// reference price, not guaranteed bookable. https://api.travelpayouts.com
const BASE_URL = 'https://api.travelpayouts.com';

interface TravelpayoutsFare {
  origin: string;
  destination: string;
  price: number;
  airline: string;
  flight_number: number;
  departure_at: string;
  return_at?: string;
  transfers: number;
  duration: number;
  duration_to?: number;
}

interface TravelpayoutsResponse {
  success: boolean;
  data: TravelpayoutsFare[];
  currency?: string;
}

function minutesToIsoDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `PT${hours}H${minutes}M`;
}

export async function searchTravelpayoutsFlights(input: TravelRequestInput): Promise<FlightOfferSummary[]> {
  if (!config.travelpayouts.token) return [];

  const { trip } = input;
  const params = new URLSearchParams({
    origin: trip.originLocationCode,
    destination: trip.destinationLocationCode,
    departure_at: trip.departureDate,
    currency: 'usd',
    sorting: 'price',
    limit: '5',
    token: config.travelpayouts.token,
  });
  if (trip.returnDate) params.set('return_at', trip.returnDate);
  if (config.travelpayouts.marker) params.set('marker', config.travelpayouts.marker);

  try {
    const res = await fetch(`${BASE_URL}/aviasales/v3/prices_for_dates?${params.toString()}`, {
      headers: { 'X-Access-Token': config.travelpayouts.token, Accept: 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[travelpayouts] search failed (${res.status})`);
      return [];
    }

    const body = (await res.json()) as TravelpayoutsResponse;
    if (!body.success) return [];

    return (body.data ?? []).map((fare) => toSummary(fare, body.currency ?? 'usd', trip.cabinClass));
  } catch (err) {
    console.warn('[travelpayouts] search errored', err);
    return [];
  }
}

function toSummary(fare: TravelpayoutsFare, currency: string, cabinClass: string): FlightOfferSummary {
  const outboundMinutes = fare.duration_to ?? fare.duration;
  const outboundArrival = new Date(new Date(fare.departure_at).getTime() + outboundMinutes * 60000).toISOString();

  const itineraries: FlightOfferSummary['itineraries'] = [
    {
      duration: minutesToIsoDuration(outboundMinutes),
      segments: [
        {
          from: fare.origin,
          to: fare.destination,
          departure: fare.departure_at,
          arrival: outboundArrival,
          carrierCode: fare.airline,
          flightNumber: String(fare.flight_number),
        },
      ],
    },
  ];

  if (fare.return_at) {
    const returnMinutes = fare.duration_to != null ? fare.duration - fare.duration_to : outboundMinutes;
    const returnArrival = new Date(new Date(fare.return_at).getTime() + returnMinutes * 60000).toISOString();
    itineraries.push({
      duration: minutesToIsoDuration(returnMinutes),
      segments: [
        {
          from: fare.destination,
          to: fare.origin,
          departure: fare.return_at,
          arrival: returnArrival,
          carrierCode: fare.airline,
          flightNumber: String(fare.flight_number),
        },
      ],
    });
  }

  return {
    id: `travelpayouts:${fare.origin}${fare.destination}${fare.departure_at}${fare.flight_number}`,
    source: 'travelpayouts',
    price: { total: String(fare.price), currency: currency.toUpperCase() },
    airlines: [fare.airline],
    airlineNames: [fare.airline],
    airlineLogos: [],
    cabin: cabinClass,
    stops: fare.transfers,
    itineraries,
    raw: fare,
  };
}
