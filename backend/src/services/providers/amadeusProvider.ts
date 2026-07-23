import { config } from '../../config';
import { TravelRequestInput, FlightOfferSummary } from '../../types/travel';

// Amadeus's Self-Service tier is sunsetting 2026-07-17 per Amadeus's own
// migration notice - fine as a stopgap comparison source, not a long-term
// dependency. https://developers.amadeus.com
const BASE_URL = 'https://test.api.amadeus.com';

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.amadeus.clientId,
      client_secret: config.amadeus.clientSecret,
    }),
  });

  if (!res.ok) {
    console.warn(`[amadeus] token request failed (${res.status})`);
    return null;
  }

  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in - 60) * 1000 };
  return cachedToken.value;
}

interface AmadeusSegment {
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
  carrierCode: string;
  number: string;
  aircraft?: { code: string };
}

interface AmadeusOffer {
  id: string;
  price: { total: string; currency: string; base?: string };
  itineraries: { duration: string; segments: AmadeusSegment[] }[];
}

interface AmadeusSearchResponse {
  data: AmadeusOffer[];
  dictionaries?: { carriers?: Record<string, string>; aircraft?: Record<string, string> };
}

export async function searchAmadeusFlights(input: TravelRequestInput): Promise<FlightOfferSummary[]> {
  if (!config.amadeus.clientId || !config.amadeus.clientSecret) return [];

  const { trip } = input;

  try {
    const token = await getAccessToken();
    if (!token) return [];

    const params = new URLSearchParams({
      originLocationCode: trip.originLocationCode,
      destinationLocationCode: trip.destinationLocationCode,
      departureDate: trip.departureDate,
      adults: '1',
      max: '5',
      travelClass: trip.cabinClass,
    });
    if (trip.returnDate) params.set('returnDate', trip.returnDate);

    const res = await fetch(`${BASE_URL}/v2/shopping/flight-offers?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[amadeus] search failed (${res.status})`);
      return [];
    }

    const body = (await res.json()) as AmadeusSearchResponse;
    const carrierNames = body.dictionaries?.carriers ?? {};
    return (body.data ?? []).map((offer) => toSummary(offer, carrierNames, trip.cabinClass));
  } catch (err) {
    console.warn('[amadeus] search errored', err);
    return [];
  }
}

function toSummary(
  offer: AmadeusOffer,
  carrierNames: Record<string, string>,
  cabinClass: string
): FlightOfferSummary {
  const itineraries = offer.itineraries.map((itin) => ({
    duration: itin.duration,
    segments: itin.segments.map((seg) => ({
      from: seg.departure.iataCode,
      to: seg.arrival.iataCode,
      departure: seg.departure.at,
      arrival: seg.arrival.at,
      carrierCode: seg.carrierCode,
      carrierName: carrierNames[seg.carrierCode],
      flightNumber: seg.number,
      aircraft: seg.aircraft?.code,
    })),
  }));

  const airlines = Array.from(new Set(itineraries.flatMap((i) => i.segments.map((s) => s.carrierCode))));
  const airlineNames = Array.from(
    new Set(itineraries.flatMap((i) => i.segments.map((s) => s.carrierName ?? s.carrierCode)))
  );

  return {
    id: `amadeus:${offer.id}`,
    source: 'amadeus',
    price: { total: offer.price.total, currency: offer.price.currency, base: offer.price.base },
    airlines,
    airlineNames,
    airlineLogos: [],
    cabin: cabinClass,
    stops: Math.max(...itineraries.map((i) => i.segments.length - 1)),
    itineraries,
    raw: offer,
  };
}
