import { FlightOfferSummary } from '../api/flights';

export function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  const h = match?.[1] ? `${match[1]}h` : '';
  const m = match?.[2] ? `${match[2]}m` : '';
  return [h, m].filter(Boolean).join(' ') || iso;
}

export function durationMinutes(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  const hours = Number(match?.[1] ?? 0);
  const minutes = Number(match?.[2] ?? 0);
  return hours * 60 + minutes;
}

export function formatTime(dateTime: string): string {
  return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateTime: string): string {
  return new Date(dateTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatMoney(currency: string, amount: string | number): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return `${currency} ${Math.round(value).toLocaleString()}`;
}

export function getInitials(givenName: string, familyName: string): string {
  return `${givenName.charAt(0)}${familyName.charAt(0)}`.toUpperCase();
}

export function formatLayover(arrival: string, nextDeparture: string): string {
  const minutes = Math.round((new Date(nextDeparture).getTime() - new Date(arrival).getTime()) / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ') || `${minutes}m`;
}

export function isPassportValid(expiry: string): boolean {
  const sixMonthsOut = new Date();
  sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);
  return new Date(expiry) >= sixMonthsOut;
}

export type FlightBadge = 'cheapest' | 'fastest' | 'flexible' | 'best_value' | 'recommended';

export function computeFlightBadges(
  offers: FlightOfferSummary[],
  preferredAirlines?: string[]
): Record<string, FlightBadge[]> {
  if (offers.length === 0) return {};

  const cheapest = [...offers].sort((a, b) => Number(a.price.total) - Number(b.price.total))[0];
  const fastest = [...offers].sort(
    (a, b) => durationMinutes(a.itineraries[0].duration) - durationMinutes(b.itineraries[0].duration)
  )[0];

  const flexible = [...offers]
    .filter((o) => o.refundability === 'fully_refundable' || o.refundability === 'partially_refundable')
    .sort((a, b) => Number(a.price.total) - Number(b.price.total))[0];

  const badges: Record<string, FlightBadge[]> = {};

  for (const offer of offers) {
    const list: FlightBadge[] = [];
    if (offer.id === cheapest.id) list.push('cheapest');
    if (offer.id === fastest.id) list.push('fastest');
    if (flexible && offer.id === flexible.id) list.push('flexible');
    if (preferredAirlines?.some((code) => offer.airlines.includes(code))) list.push('recommended');

    const priceRank = Number(offer.price.total) / Number(cheapest.price.total);
    const durationRank =
      durationMinutes(offer.itineraries[0].duration) / durationMinutes(fastest.itineraries[0].duration);
    if (priceRank < 1.15 && durationRank < 1.2 && !list.includes('cheapest') && !list.includes('fastest')) {
      list.push('best_value');
    }

    badges[offer.id] = list;
  }

  return badges;
}

export type FlightFilter = 'cheapest' | 'fastest' | 'direct' | 'flexible' | 'business' | 'economy';

export function filterAndSortOffers(offers: FlightOfferSummary[], filter: FlightFilter): FlightOfferSummary[] {
  let result = [...offers];

  if (filter === 'direct') {
    result = result.filter((o) => o.stops === 0);
  }
  if (filter === 'flexible') {
    result = result.filter(
      (o) => o.refundability === 'fully_refundable' || o.refundability === 'partially_refundable'
    );
  }
  if (filter === 'business') {
    result = result.filter((o) => o.cabin === 'BUSINESS');
  }
  if (filter === 'economy') {
    result = result.filter((o) => o.cabin === 'ECONOMY');
  }

  if (filter === 'fastest') {
    result.sort((a, b) => durationMinutes(a.itineraries[0].duration) - durationMinutes(b.itineraries[0].duration));
  } else {
    result.sort((a, b) => Number(a.price.total) - Number(b.price.total));
  }

  return result;
}
