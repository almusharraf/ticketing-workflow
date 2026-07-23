import { duffelRequest } from './duffelClient';
import { TravelRequestInput, FlightOfferSummary } from '../types/travel';
import { searchKiwiFlights } from './providers/kiwiProvider';
import { searchSkyscannerFlights } from './providers/skyscannerProvider';
import { searchTravelpayoutsFlights } from './providers/travelpayoutsProvider';
import { searchAmadeusFlights } from './providers/amadeusProvider';

// Bumped from 5 now that results are aggregated across multiple sources -
// only 'duffel'-sourced offers are ever actually booked (see
// findBookableOffer); the rest are shown for price comparison only.
const RESULTS_TO_RETURN = 8;

const CABIN_CLASS_MAP: Record<TravelRequestInput['trip']['cabinClass'], string> = {
  ECONOMY: 'economy',
  BUSINESS: 'business',
};

interface DuffelCondition {
  allowed: boolean;
  penalty_amount?: string | null;
}

interface DuffelSegment {
  origin: { iata_code: string; terminal?: string };
  destination: { iata_code: string; terminal?: string };
  departing_at: string;
  arriving_at: string;
  marketing_carrier: { iata_code: string; name?: string };
  marketing_carrier_flight_number: string;
  aircraft?: { name?: string };
}

interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  tax_amount?: string;
  base_amount?: string;
  total_emissions_kg?: string;
  available_services?: { type: string }[];
  conditions?: {
    refund_before_departure?: DuffelCondition | null;
    change_before_departure?: DuffelCondition | null;
  };
  owner: { name: string; iata_code: string; logo_symbol_url?: string };
  passengers?: { id: string; baggages?: { type: string; quantity: number }[] }[];
  slices: {
    duration: string;
    fare_brand_name?: string;
    segments: DuffelSegment[];
  }[];
}

interface DuffelOfferRequestResponse {
  data: {
    id: string;
    offers: DuffelOffer[];
  };
}

async function fetchOfferPool(trip: TravelRequestInput['trip']): Promise<DuffelOffer[]> {
  const slices = [
    { origin: trip.originLocationCode, destination: trip.destinationLocationCode, departure_date: trip.departureDate },
  ];

  if (trip.returnDate) {
    slices.push({
      origin: trip.destinationLocationCode,
      destination: trip.originLocationCode,
      departure_date: trip.returnDate,
    });
  }

  const response = await duffelRequest<DuffelOfferRequestResponse>('/air/offer_requests?return_offers=true', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        slices,
        passengers: [{ type: 'adult' }],
        cabin_class: CABIN_CLASS_MAP[trip.cabinClass],
      },
    }),
  });

  // Duffel's sandbox mixes in offers from its own dummy test airline
  // ("Duffel Airways", carrier code ZZ) alongside real airline test content.
  // It's only ever there in test mode, never with a live API key - drop it
  // so results only ever show real carriers.
  const realOffers = (response.data.offers ?? []).filter((offer) => offer.owner.iata_code !== 'ZZ');

  return dedupeOffers(realOffers);
}

export async function searchCheapestFlights(input: TravelRequestInput): Promise<FlightOfferSummary[]> {
  const { trip } = input;

  const [duffelOffers, ...comparisonResults] = await Promise.all([
    fetchOfferPool(trip).then((offers) => offers.map((offer) => toSummary(offer, trip.cabinClass))),
    // Comparison-only sources - each is independently defensive (returns []
    // on any error/missing key) so one failing provider never blocks Duffel.
    searchKiwiFlights(input),
    searchSkyscannerFlights(input),
    searchTravelpayoutsFlights(input),
    searchAmadeusFlights(input),
  ]);

  const allOffers = [duffelOffers, ...comparisonResults].flat();
  const sorted = allOffers.sort((a, b) => Number(a.price.total) - Number(b.price.total));

  const preferred = trip.preferredAirlines;
  if (preferred?.length) {
    const filtered = sorted.filter((offer) => offer.airlines.some((code) => preferred.includes(code)));
    if (filtered.length >= RESULTS_TO_RETURN) {
      return filtered.slice(0, RESULTS_TO_RETURN);
    }
  }

  return sorted.slice(0, RESULTS_TO_RETURN);
}

/**
 * The offer a traveler picked can go stale by the time a manager approves it
 * - Duffel offers are short-lived quotes, and once they expire there's no way
 * to "refresh" the same offer ID, only to search again and find the same
 * flight priced fresh. This re-runs the search and matches on the flights
 * actually flown (carrier + flight number + departure time per leg), not the
 * offer ID, so a same-flight fare found again still books correctly even if
 * its price moved.
 */
export async function findBookableOffer(
  trip: TravelRequestInput['trip'],
  target: FlightOfferSummary
): Promise<{ offerId: string; totalAmount: string; totalCurrency: string; passengerId: string }> {
  const offers = await fetchOfferPool(trip);
  const targetSignature = signatureFromSummary(target);
  const match = offers.find((offer) => signatureFromRaw(offer) === targetSignature);

  if (!match) {
    throw new Error('This fare is no longer available from the airline. Please search again and pick a current option.');
  }

  const passengerId = match.passengers?.[0]?.id;
  if (!passengerId) {
    throw new Error('Matched fare has no passenger slot to book against');
  }

  return {
    offerId: match.id,
    totalAmount: match.total_amount,
    totalCurrency: match.total_currency,
    passengerId,
  };
}

function signatureFromRaw(offer: DuffelOffer): string {
  return offer.slices
    .map((slice) =>
      slice.segments
        .map((seg) => `${seg.marketing_carrier.iata_code}${seg.marketing_carrier_flight_number}:${seg.departing_at}`)
        .join('>')
    )
    .join('|');
}

function signatureFromSummary(offer: FlightOfferSummary): string {
  return offer.itineraries
    .map((itin) => itin.segments.map((seg) => `${seg.carrierCode}${seg.flightNumber}:${seg.departure}`).join('>'))
    .join('|');
}

// Duffel frequently returns the same physical flight/fare multiple times
// (once per distribution channel it sourced it from). Collapse those before
// picking the cheapest 5, keyed on what actually makes an itinerary distinct
// to a traveler: the flights flown and what they'd pay for them.
function dedupeOffers(offers: DuffelOffer[]): DuffelOffer[] {
  const seen = new Map<string, DuffelOffer>();

  for (const offer of offers) {
    const key = `${signatureFromRaw(offer)}@${offer.total_amount}`;
    if (!seen.has(key)) {
      seen.set(key, offer);
    }
  }

  return Array.from(seen.values());
}

function toSummary(offer: DuffelOffer, cabinClass: string): FlightOfferSummary {
  const itineraries = offer.slices.map((slice) => ({
    duration: slice.duration,
    segments: slice.segments.map((seg) => ({
      from: seg.origin.iata_code,
      to: seg.destination.iata_code,
      departure: seg.departing_at,
      arrival: seg.arriving_at,
      carrierCode: seg.marketing_carrier.iata_code,
      carrierName: seg.marketing_carrier.name,
      flightNumber: seg.marketing_carrier_flight_number,
      aircraft: seg.aircraft?.name,
      terminal: seg.origin.terminal,
    })),
  }));

  const airlines = Array.from(
    new Set(offer.slices.flatMap((slice) => slice.segments.map((seg) => seg.marketing_carrier.iata_code)))
  );

  const airlineNames = Array.from(
    new Set(
      offer.slices.flatMap((slice) =>
        slice.segments.map((seg) => seg.marketing_carrier.name ?? seg.marketing_carrier.iata_code)
      )
    )
  );

  const airlineLogos = offer.owner.logo_symbol_url ? [offer.owner.logo_symbol_url] : [];

  const stops = Math.max(...offer.slices.map((slice) => slice.segments.length - 1));
  const fareFamily = offer.slices.find((s) => s.fare_brand_name)?.fare_brand_name;

  const base = offer.base_amount;
  const tax = offer.tax_amount ?? (base ? String(Number(offer.total_amount) - Number(base)) : undefined);

  return {
    id: `duffel:${offer.id}`,
    source: 'duffel',
    price: {
      total: offer.total_amount,
      currency: offer.total_currency,
      base,
      tax,
    },
    airlines,
    airlineNames,
    airlineLogos,
    cabin: cabinClass,
    fareFamily,
    stops,
    refundability: mapRefundability(offer.conditions?.refund_before_departure),
    carryOn: inferCarryOn(offer),
    checkedBaggage: inferCheckedBaggage(offer),
    wifi: inferAmenity(offer, 'wifi'),
    powerOutlets: inferAmenity(offer, 'power'),
    carbonEmissionsKg: offer.total_emissions_kg ? Number(offer.total_emissions_kg) : undefined,
    itineraries,
    raw: offer,
  };
}

function mapRefundability(
  condition?: DuffelCondition | null
): FlightOfferSummary['refundability'] {
  if (!condition) return 'unknown';
  if (!condition.allowed) return 'non_refundable';
  const penalty = Number(condition.penalty_amount ?? 0);
  return penalty === 0 ? 'fully_refundable' : 'partially_refundable';
}

function inferCarryOn(offer: DuffelOffer): string | undefined {
  const baggages = offer.passengers?.[0]?.baggages ?? [];
  const carryOn = baggages.find((b) => b.type === 'carry_on');
  if (carryOn) return `${carryOn.quantity} carry-on`;
  return undefined;
}

function inferCheckedBaggage(offer: DuffelOffer): string | undefined {
  const baggages = offer.passengers?.[0]?.baggages ?? [];
  const checked = baggages.find((b) => b.type === 'checked');
  if (checked) return `${checked.quantity} checked bag${checked.quantity > 1 ? 's' : ''}`;
  return 'Not included';
}

function inferAmenity(offer: DuffelOffer, type: 'wifi' | 'power'): boolean | undefined {
  const services = offer.available_services ?? [];
  const match = services.some((s) => s.type.toLowerCase().includes(type));
  return match ? true : undefined;
}
