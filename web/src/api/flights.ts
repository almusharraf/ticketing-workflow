export interface FlightSegmentSummary {
  from: string;
  to: string;
  departure: string;
  arrival: string;
  carrierCode: string;
  carrierName?: string;
  flightNumber: string;
  aircraft?: string;
  terminal?: string;
}

export interface FlightOfferSummary {
  id: string;
  price: {
    total: string;
    currency: string;
    base?: string;
    tax?: string;
  };
  airlines: string[];
  airlineNames: string[];
  airlineLogos: string[];
  cabin: string;
  fareFamily?: string;
  stops: number;
  bookableSeats?: number;
  refundability?: 'fully_refundable' | 'partially_refundable' | 'non_refundable' | 'unknown';
  carryOn?: string;
  checkedBaggage?: string;
  wifi?: boolean;
  powerOutlets?: boolean;
  carbonEmissionsKg?: number;
  itineraries: {
    duration: string;
    segments: FlightSegmentSummary[];
  }[];
  raw: unknown; // full Duffel offer - must be sent back unmodified when booking
}

export interface EmployeeProfile {
  title: 'mr' | 'ms' | 'mrs';
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  gender: 'm' | 'f';
  email: string;
  phoneNumber: string;
  passportNumber: string;
  passportExpiry: string;
}

export interface TravelRequestInput {
  employee: EmployeeProfile;
  trip: {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    returnDate?: string;
    cabinClass: 'ECONOMY' | 'BUSINESS';
    checkedBags?: number;
    preferredAirlines?: string[];
    reason?: string;
  };
}

export async function searchFlights(input: TravelRequestInput): Promise<FlightOfferSummary[]> {
  const res = await fetch('/api/flights/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || 'Flight search failed');
  }

  const data = await res.json();
  return data.offers;
}
