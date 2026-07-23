import { config } from '../../config';
import { TravelRequestInput, FlightOfferSummary } from '../../types/travel';

// Official Skyscanner Partner "Flights Live Prices" API (create + poll a
// search session). Requires partner approval - see
// https://developers.skyscanner.net/api/flights-live-pricing
// Segment-level field names below are best-effort against the published
// schema; verify against a live sandbox response once you have partner
// access, since Skyscanner doesn't publish full segment field docs publicly.
const BASE_URL = 'https://partners.api.skyscanner.net/apiservices/v3';
const POLL_ATTEMPTS = 4;
const POLL_DELAY_MS = 1500;

interface SkyPlace {
  iata?: string;
}

interface SkyCarrier {
  name?: string;
  iata?: string;
}

interface SkySegment {
  originPlaceId?: string;
  destinationPlaceId?: string;
  departureDateTime?: { year: number; month: number; day: number; hour: number; minute: number };
  arrivalDateTime?: { year: number; month: number; day: number; hour: number; minute: number };
  marketingCarrierId?: string;
  marketingFlightNumber?: string;
}

interface SkyLeg {
  originPlaceId?: string;
  destinationPlaceId?: string;
  segmentIds?: string[];
  durationInMinutes?: number;
  stopCount?: number;
}

interface SkyItinerary {
  legIds: string[];
  pricingOptions: { price: { amount: string; unit?: string } }[];
}

interface SkyPollResponse {
  status: string;
  content?: {
    results?: {
      itineraries?: Record<string, SkyItinerary>;
      legs?: Record<string, SkyLeg>;
      segments?: Record<string, SkySegment>;
      places?: Record<string, SkyPlace>;
      carriers?: Record<string, SkyCarrier>;
    };
  };
}

function dateTimeToIso(dt?: SkySegment['departureDateTime']): string {
  if (!dt) return new Date().toISOString();
  return new Date(Date.UTC(dt.year, dt.month - 1, dt.day, dt.hour, dt.minute)).toISOString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function searchSkyscannerFlights(input: TravelRequestInput): Promise<FlightOfferSummary[]> {
  if (!config.skyscanner.apiKey) return [];

  const { trip } = input;

  const queryLegs = [
    {
      originPlaceId: { iata: trip.originLocationCode },
      destinationPlaceId: { iata: trip.destinationLocationCode },
      date: isoToDateParts(trip.departureDate),
    },
  ];
  if (trip.returnDate) {
    queryLegs.push({
      originPlaceId: { iata: trip.destinationLocationCode },
      destinationPlaceId: { iata: trip.originLocationCode },
      date: isoToDateParts(trip.returnDate),
    });
  }

  try {
    const createRes = await fetch(`${BASE_URL}/flights/live/search/create`, {
      method: 'POST',
      headers: {
        'x-api-key': config.skyscanner.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          market: config.skyscanner.market,
          locale: config.skyscanner.locale,
          currency: config.skyscanner.currency,
          queryLegs,
          adults: 1,
          cabinClass: trip.cabinClass === 'BUSINESS' ? 'CABIN_CLASS_BUSINESS' : 'CABIN_CLASS_ECONOMY',
        },
      }),
    });

    if (!createRes.ok) {
      console.warn(`[skyscanner] create search failed (${createRes.status})`);
      return [];
    }

    let body = (await createRes.json()) as { sessionToken: string } & SkyPollResponse;
    const sessionToken = body.sessionToken;

    for (let attempt = 0; attempt < POLL_ATTEMPTS && body.status !== 'RESULT_STATUS_COMPLETE'; attempt++) {
      await sleep(POLL_DELAY_MS);
      const pollRes = await fetch(`${BASE_URL}/flights/live/search/poll/${sessionToken}`, {
        method: 'POST',
        headers: { 'x-api-key': config.skyscanner.apiKey },
      });
      if (!pollRes.ok) {
        console.warn(`[skyscanner] poll failed (${pollRes.status})`);
        return [];
      }
      body = await pollRes.json();
    }

    return mapResults(body, trip.cabinClass);
  } catch (err) {
    console.warn('[skyscanner] search errored', err);
    return [];
  }
}

function isoToDateParts(isoDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = isoDate.split('-').map(Number);
  return { year, month, day };
}

function mapResults(body: SkyPollResponse, cabinClass: string): FlightOfferSummary[] {
  const results = body.content?.results;
  if (!results?.itineraries) return [];

  const { itineraries, legs = {}, segments = {}, places = {}, carriers = {} } = results;
  const summaries: FlightOfferSummary[] = [];

  for (const [itinId, itin] of Object.entries(itineraries)) {
    try {
      const cheapestOption = [...itin.pricingOptions].sort(
        (a, b) => Number(a.price.amount) - Number(b.price.amount)
      )[0];
      if (!cheapestOption) continue;

      const itinerarySummaries = itin.legIds.map((legId) => {
        const leg = legs[legId];
        const segmentSummaries = (leg?.segmentIds ?? []).map((segId) => {
          const seg = segments[segId];
          const carrier = seg?.marketingCarrierId ? carriers[seg.marketingCarrierId] : undefined;
          return {
            from: (seg?.originPlaceId && places[seg.originPlaceId]?.iata) ?? '',
            to: (seg?.destinationPlaceId && places[seg.destinationPlaceId]?.iata) ?? '',
            departure: dateTimeToIso(seg?.departureDateTime),
            arrival: dateTimeToIso(seg?.arrivalDateTime),
            carrierCode: carrier?.iata ?? seg?.marketingCarrierId ?? '',
            carrierName: carrier?.name,
            flightNumber: seg?.marketingFlightNumber ?? '',
          };
        });

        return {
          duration: `PT${leg?.durationInMinutes ?? 0}M`,
          segments: segmentSummaries,
        };
      });

      const airlines = Array.from(
        new Set(itinerarySummaries.flatMap((i) => i.segments.map((s) => s.carrierCode)).filter(Boolean))
      );
      const airlineNames = Array.from(
        new Set(itinerarySummaries.flatMap((i) => i.segments.map((s) => s.carrierName ?? s.carrierCode)).filter(Boolean))
      );

      summaries.push({
        id: `skyscanner:${itinId}`,
        source: 'skyscanner',
        price: { total: cheapestOption.price.amount, currency: config.skyscanner.currency },
        airlines,
        airlineNames,
        airlineLogos: [],
        cabin: cabinClass,
        stops: Math.max(...itinerarySummaries.map((i) => i.segments.length - 1)),
        itineraries: itinerarySummaries,
        raw: itin,
      });
    } catch (err) {
      // One malformed itinerary shouldn't drop the whole result set.
      console.warn('[skyscanner] failed to map itinerary', itinId, err);
    }
  }

  return summaries;
}
